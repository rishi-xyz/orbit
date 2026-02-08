#![no_std]
use soroban_sdk::{
    contract, contractclient, contractimpl, contracttype, Address, Env, String, Vec,
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Creator,
    TokenContract,
    Balance,
    BackendExecutor,
    Paused,
}

#[contract]
pub struct CreatorVault;

#[contractimpl]
impl CreatorVault {
    /// Initialize the creator vault
    pub fn initialize(env: Env, creator: Address, token_contract: Address) {
        if env.storage().instance().has(&DataKey::Creator) {
            panic!("Vault already initialized");
        }

        env.storage().instance().set(&DataKey::Creator, &creator);
        env.storage()
            .instance()
            .set(&DataKey::TokenContract, &token_contract);
        env.storage().instance().set(&DataKey::Balance, &0i128);
        env.storage().instance().set(&DataKey::Paused, &false);
    }

    /// Deposit tokens into the vault
    pub fn deposit(env: Env, from: Address, amount: i128) {
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Check if vault is paused
        if env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
        {
            panic!("Vault is paused");
        }

        // Update vault balance
        let mut balance: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance)
            .unwrap_or(0i128);
        balance += amount;
        env.storage().instance().set(&DataKey::Balance, &balance);

        // Emit deposit event
        env.events()
            .publish(("vault", "deposit"), (from, amount, balance));
    }

    /// Withdraw tokens (only creator can withdraw)
    pub fn withdraw(env: Env, to: Address, amount: i128) {
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Get creator and authorize
        let creator: Address = env
            .storage()
            .instance()
            .get(&DataKey::Creator)
            .unwrap_or_else(|| panic!("Creator not set"));

        creator.require_auth();

        // Check balance
        let balance: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance)
            .unwrap_or(0i128);

        if balance < amount {
            panic!("Insufficient balance");
        }

        // Update balance
        let new_balance = balance - amount;
        env.storage()
            .instance()
            .set(&DataKey::Balance, &new_balance);

        // Emit withdrawal event
        env.events()
            .publish(("vault", "withdraw"), (to, amount, new_balance));
    }

    /// Spend tokens for strategy execution
    pub fn spend_for_execution(
        env: Env,
        to: Address,
        amount: i128,
        purpose: String,
        tx_hash: String,
    ) {
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Check if vault is paused
        if env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
        {
            panic!("Vault is paused");
        }

        // Authorize executor or creator
        let backend_executor: Option<Address> =
            env.storage().instance().get(&DataKey::BackendExecutor);
        let creator: Address = env
            .storage()
            .instance()
            .get(&DataKey::Creator)
            .unwrap_or_else(|| panic!("Creator not set"));

        // Allow either backend executor or creator to spend
        if let Some(executor) = backend_executor {
            executor.require_auth();
        } else {
            creator.require_auth();
        }

        // Check balance
        let balance: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance)
            .unwrap_or(0i128);

        if balance < amount {
            panic!("Insufficient balance for execution");
        }

        // Update balance
        let new_balance = balance - amount;
        env.storage()
            .instance()
            .set(&DataKey::Balance, &new_balance);

        // Emit execution event
        env.events()
            .publish(("vault", "execution"), (to, amount, purpose, tx_hash));
    }

    /// Set backend executor (only creator can set)
    pub fn set_backend_executor(env: Env, executor: Address) {
        let creator: Address = env
            .storage()
            .instance()
            .get(&DataKey::Creator)
            .unwrap_or_else(|| panic!("Creator not set"));

        creator.require_auth();
        env.storage()
            .instance()
            .set(&DataKey::BackendExecutor, &executor);
    }

    /// Pause/unpause vault (only creator can pause)
    pub fn set_paused(env: Env, paused: bool) {
        let creator: Address = env
            .storage()
            .instance()
            .get(&DataKey::Creator)
            .unwrap_or_else(|| panic!("Creator not set"));

        creator.require_auth();
        env.storage().instance().set(&DataKey::Paused, &paused);
    }

    /// Get vault information
    pub fn get_vault_info(env: Env) -> (Address, Address, i128, bool) {
        let creator: Address = env
            .storage()
            .instance()
            .get(&DataKey::Creator)
            .unwrap_or_else(|| panic!("Creator not set"));

        let token_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenContract)
            .unwrap_or_else(|| panic!("Token contract not set"));

        let balance: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance)
            .unwrap_or(0i128);

        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);

        (creator, token_contract, balance, paused)
    }

    /// Get backend executor
    pub fn get_backend_executor(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::BackendExecutor)
    }
}
