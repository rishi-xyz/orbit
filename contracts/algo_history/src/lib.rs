#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Record {
    pub ts: u64,
    pub algo_id: u32,
    pub tx_hash: String,
    pub note: String,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Writer,
    Count(u32),
    Record(u32, u32),
}

fn read_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("admin not set")
}

fn read_writer(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Writer)
        .unwrap_or_else(|| read_admin(env))
}

fn read_count(env: &Env, algo_id: u32) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::Count(algo_id))
        .unwrap_or(0u32)
}

fn write_count(env: &Env, algo_id: u32, count: u32) {
    env.storage()
        .instance()
        .set(&DataKey::Count(algo_id), &count);
}

#[contract]
pub struct AlgoHistory;

#[contractimpl]
impl AlgoHistory {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Writer, &admin);
    }

    pub fn admin(env: Env) -> Address {
        read_admin(&env)
    }

    pub fn writer(env: Env) -> Address {
        read_writer(&env)
    }

    pub fn set_writer(env: Env, writer: Address) {
        let admin = read_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Writer, &writer);
    }

    pub fn add_record(env: Env, algo_id: u32, tx_hash: String, note: String) -> u32 {
        let writer = read_writer(&env);
        writer.require_auth();

        let idx = read_count(&env, algo_id);
        let rec = Record {
            ts: env.ledger().timestamp(),
            algo_id,
            tx_hash,
            note,
        };

        env.storage()
            .instance()
            .set(&DataKey::Record(algo_id, idx), &rec);
        write_count(&env, algo_id, idx + 1);
        idx
    }

    pub fn count(env: Env, algo_id: u32) -> u32 {
        read_count(&env, algo_id)
    }

    pub fn get(env: Env, algo_id: u32, idx: u32) -> Option<Record> {
        env.storage().instance().get(&DataKey::Record(algo_id, idx))
    }

    pub fn list(env: Env, algo_id: u32, start: u32, limit: u32) -> Vec<Record> {
        let total = read_count(&env, algo_id);
        let mut out = Vec::new(&env);

        let mut i = start;
        while i < total && out.len() < limit {
            if let Some(rec) = env.storage().instance().get(&DataKey::Record(algo_id, i)) {
                out.push_back(rec);
            }
            i += 1;
        }
        out
    }

    pub fn transfer_admin(env: Env, new_admin: Address) {
        let admin = read_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }
}

#[cfg(test)]
mod test {
    extern crate std;

    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn add_and_list_records() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, AlgoHistory);
        let client = super::AlgoHistoryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.init(&admin);

        let algo_id = 7u32;
        client.add_record(
            &algo_id,
            &String::from_str(&env, "txhash1"),
            &String::from_str(&env, "first"),
        );
        client.add_record(
            &algo_id,
            &String::from_str(&env, "txhash2"),
            &String::from_str(&env, "second"),
        );

        assert_eq!(client.count(&algo_id), 2);
        let list = client.list(&algo_id, &0, &10);
        assert_eq!(list.len(), 2);
        assert_eq!(list.get(0).unwrap().tx_hash, String::from_str(&env, "txhash1"));
    }
}
