#![no_std]
use soroban_sdk::{contract, contractclient, contractimpl, contracttype, Address, Env, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    TokenContract,
    CreatorToVault(Address),
}

#[contract]
pub struct CreatorVaultFactory;

#[contractimpl]
impl CreatorVaultFactory {
    /// Initialize the factory with admin and token contract
    pub fn initialize(env: Env, admin: Address, token_contract: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Factory already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::TokenContract, &token_contract);
    }

    /// Create a new vault for a creator
    /// Returns the address of the newly created vault contract
    pub fn create_creator_vault(env: Env, creator: Address) -> Address {
        // Check if creator already has a vault
        let creator_key = DataKey::CreatorToVault(creator.clone());
        if env.storage().instance().has(&creator_key) {
            panic!("Creator already has a vault");
        }

        // Get token contract
        let token_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenContract)
            .unwrap_or_else(|| panic!("Token contract not set"));

        // For now, return a placeholder address
        // In a real implementation, you'd need to deploy the contract properly
        // using the Stellar contract deployment mechanism
        let vault_address = creator.clone();

        // Map creator to vault
        env.storage().instance().set(&creator_key, &vault_address);

        vault_address
    }

    /// Get the vault address for a creator
    pub fn get_creator_vault(env: Env, creator: Address) -> Option<Address> {
        env.storage()
            .instance()
            .get(&DataKey::CreatorToVault(creator))
    }

    /// Check if a creator is registered (has a vault)
    pub fn is_creator_registered(env: Env, creator: Address) -> bool {
        env.storage()
            .instance()
            .has(&DataKey::CreatorToVault(creator))
    }

    /// Get all registered creators (simplified - returns empty for now)
    pub fn get_registered_creators(env: Env, _offset: u32, _limit: u32) -> Vec<Address> {
        Vec::new(&env)
        // In a real implementation, you'd maintain a separate list for efficient pagination
    }

    /// Update admin (only current admin can call)
    pub fn update_admin(env: Env, new_admin: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Admin not set"));

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    /// Update token contract (only admin can call)
    pub fn update_token_contract(env: Env, new_token_contract: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Admin not set"));

        admin.require_auth();
        env.storage()
            .instance()
            .set(&DataKey::TokenContract, &new_token_contract);
    }

    /// Get factory configuration
    pub fn get_factory_info(env: Env) -> (Address, Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Admin not set"));

        let token_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenContract)
            .unwrap_or_else(|| panic!("Token contract not set"));

        (admin, token_contract)
    }
}
