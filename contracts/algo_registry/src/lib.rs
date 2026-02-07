#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Algo {
    pub owner: Address,
    pub name: String,
    pub metadata_uri: String,
    pub params_hash: String,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    NextId,
    Algo(u32),
}

fn read_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("admin not set")
}

fn read_next_id(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::NextId)
        .unwrap_or(0u32)
}

fn write_next_id(env: &Env, next: u32) {
    env.storage().instance().set(&DataKey::NextId, &next);
}

#[contract]
pub struct AlgoRegistry;

#[contractimpl]
impl AlgoRegistry {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        write_next_id(&env, 0);
    }

    pub fn admin(env: Env) -> Address {
        read_admin(&env)
    }

    pub fn create_algo(
        env: Env,
        owner: Address,
        name: String,
        metadata_uri: String,
        params_hash: String,
    ) -> u32 {
        owner.require_auth();

        let id = read_next_id(&env);
        let algo = Algo {
            owner: owner.clone(),
            name,
            metadata_uri,
            params_hash,
            active: true,
        };

        env.storage().instance().set(&DataKey::Algo(id), &algo);
        write_next_id(&env, id + 1);
        id
    }

    pub fn set_active(env: Env, id: u32, active: bool) {
        let mut algo: Algo = env
            .storage()
            .instance()
            .get(&DataKey::Algo(id))
            .expect("algo not found");

        algo.owner.require_auth();
        algo.active = active;
        env.storage().instance().set(&DataKey::Algo(id), &algo);
    }

    pub fn update_metadata(
        env: Env,
        id: u32,
        name: String,
        metadata_uri: String,
        params_hash: String,
    ) {
        let mut algo: Algo = env
            .storage()
            .instance()
            .get(&DataKey::Algo(id))
            .expect("algo not found");

        algo.owner.require_auth();
        algo.name = name;
        algo.metadata_uri = metadata_uri;
        algo.params_hash = params_hash;
        env.storage().instance().set(&DataKey::Algo(id), &algo);
    }

    pub fn get_algo(env: Env, id: u32) -> Option<Algo> {
        env.storage().instance().get(&DataKey::Algo(id))
    }

    pub fn total_algos(env: Env) -> u32 {
        read_next_id(&env)
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
    fn create_and_read_algo() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, AlgoRegistry);
        let client = super::AlgoRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.init(&admin);

        let owner = Address::generate(&env);
        let id = client.create_algo(
            &owner,
            &String::from_str(&env, "mean_reversion"),
            &String::from_str(&env, "ipfs://cid"),
            &String::from_str(&env, "sha256:..."),
        );

        let algo = client.get_algo(&id).unwrap();
        assert_eq!(algo.owner, owner);
        assert!(algo.active);
        assert_eq!(client.total_algos(), 1);
    }
}
