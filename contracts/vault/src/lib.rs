#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Owner,
    Token,
    Executor,
    History,
}

fn read_owner(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Owner)
        .expect("owner not set")
}

fn read_token(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Token)
        .expect("token not set")
}

fn read_executor(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Executor)
}

fn read_history(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::History)
}

#[contract]
pub struct Vault;

#[contractimpl]
impl Vault {
    pub fn init(env: Env, owner: Address, token_contract: Address) {
        if env.storage().instance().has(&DataKey::Owner) {
            panic!("already initialized");
        }
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage()
            .instance()
            .set(&DataKey::Token, &token_contract);
    }

    pub fn owner(env: Env) -> Address {
        read_owner(&env)
    }

    pub fn token(env: Env) -> Address {
        read_token(&env)
    }

    pub fn executor(env: Env) -> Option<Address> {
        read_executor(&env)
    }

    pub fn history(env: Env) -> Option<Address> {
        read_history(&env)
    }

    pub fn set_executor(env: Env, executor: Address) {
        let owner = read_owner(&env);
        owner.require_auth();
        env.storage().instance().set(&DataKey::Executor, &executor);
    }

    pub fn clear_executor(env: Env) {
        let owner = read_owner(&env);
        owner.require_auth();
        env.storage().instance().remove(&DataKey::Executor);
    }

    pub fn set_history(env: Env, history_contract: Address) {
        let owner = read_owner(&env);
        owner.require_auth();
        env.storage().instance().set(&DataKey::History, &history_contract);
    }

    pub fn deposit(env: Env, from: Address, amount: i128) {
        if amount <= 0 {
            panic!("amount must be positive");
        }
        from.require_auth();

        let token_contract = read_token(&env);
        let token_client = token::Client::new(&env, &token_contract);
        let vault = env.current_contract_address();

        token_client.transfer(&from, &vault, &amount);
    }

    pub fn withdraw(env: Env, to: Address, amount: i128) {
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let owner = read_owner(&env);
        owner.require_auth();

        let token_contract = read_token(&env);
        let token_client = token::Client::new(&env, &token_contract);
        let vault = env.current_contract_address();

        token_client.transfer(&vault, &to, &amount);
    }

    pub fn balance(env: Env) -> i128 {
        let token_contract = read_token(&env);
        let token_client = token::Client::new(&env, &token_contract);
        token_client.balance(&env.current_contract_address())
    }

    pub fn spend_for_algo(
        env: Env,
        algo_id: u32,
        to: Address,
        amount: i128,
        tx_hash: String,
        note: String,
    ) {
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let exec = read_executor(&env).expect("executor not set");
        exec.require_auth();

        let token_contract = read_token(&env);
        let token_client = token::Client::new(&env, &token_contract);
        let vault = env.current_contract_address();

        token_client.transfer(&vault, &to, &amount);

        if let Some(history_addr) = read_history(&env) {
            let history = algo_history::AlgoHistoryClient::new(&env, &history_addr);
            history.add_record(&algo_id, &tx_hash, &note);
        }
    }

    pub fn transfer_ownership(env: Env, new_owner: Address) {
        let owner = read_owner(&env);
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &new_owner);
    }
}

#[cfg(test)]
mod test {
    extern crate std;

    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn init_and_set_executor() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, Vault);
        let client = super::VaultClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let token = Address::generate(&env);
        client.init(&owner, &token);

        let exec = Address::generate(&env);
        client.set_executor(&exec);
        assert_eq!(client.executor().unwrap(), exec);
    }
}
