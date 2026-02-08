import {
  Address,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
  rpc,
} from "@stellar/stellar-sdk"

export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org"

export const SOROBAN_NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE ?? Networks.TESTNET

export const CONTRACT_IDS = {
  algoRegistry:
    process.env.NEXT_PUBLIC_ALGO_REGISTRY_CONTRACT_ID ??
    "CDN6JU5OYBNGB7U3CVXTUGRL3O7ADSW32XZT4VO3W5L267TAQP6XGSUP",
  algoHistory:
    process.env.NEXT_PUBLIC_ALGO_HISTORY_CONTRACT_ID ??
    "CANN57N463HX3ANR6DBJI3NJ7WRBPFHRWVT3AHZSAFZBVQKWW3D3JE4D",
  vault:
    process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID ??
    "CAY6QHFLEETITYBTX2DR5ZAXET7FZOOOLQGU6A5HIHMP7LS576HBS4IJ",
} as const

export const VAULT_INIT_OWNER =
  process.env.NEXT_PUBLIC_VAULT_OWNER ??
  "GAWXBVRX3NLPU7CQXQ7DMQQSCKXO2FJCJD2ZLGIPOYUNNPGXTB6AOLZP"

export const VAULT_INIT_TOKEN_CONTRACT =
  process.env.NEXT_PUBLIC_VAULT_TOKEN_CONTRACT_ID ??
  "CAPVTLRAREBH6TQVKAYQALCHQCDOPLY3WUYOKK26RTF5NPSBXGHM2C6W"

const READONLY_SOURCE_ACCOUNT =
  process.env.NEXT_PUBLIC_READONLY_SOURCE_ACCOUNT ??
  "GBOQA7EK4NYZNQU2OQVTZ4VBOW6ZTHO4IICW5KREIHGORBJASQDHILBR"

export function getSorobanServer() {
  return new rpc.Server(SOROBAN_RPC_URL)
}

export type RegistryAlgo = {
  id: number
  owner: string
  name: string
  metadataUri: string
  paramsHash: string
  active: boolean
}

async function simulateContractCall<T>(
  server: rpc.Server,
  sourceAccount: any,
  contractId: string,
  method: string,
  args: xdr.ScVal[]
): Promise<T> {
  const contract = new Contract(contractId)

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100000",
    networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build()

  const sim = await server.simulateTransaction(tx)

  const simAny = sim as any
  if (simAny?.error || simAny?.status === "ERROR") {
    throw new Error(simAny?.error ?? simAny?.message ?? "Simulation failed")
  }

  const retval = simAny?.result?.retval ?? simAny?.retval
  return scValToNative(retval) as T
}

export async function fetchRegistryTotalAlgos() {
  const server = getSorobanServer()
  const source = await server.getAccount(READONLY_SOURCE_ACCOUNT)

  return await simulateContractCall<number>(
    server,
    source,
    CONTRACT_IDS.algoRegistry,
    "total_algos",
    []
  )
}

export async function fetchRegistryAlgo(id: number) {
  const server = getSorobanServer()
  const source = await server.getAccount(READONLY_SOURCE_ACCOUNT)

  const out = await simulateContractCall<any>(
    server,
    source,
    CONTRACT_IDS.algoRegistry,
    "get_algo",
    [nativeToScVal(id, { type: "u32" })]
  )

  if (!out) return null

  const owner = out.owner instanceof Address ? out.owner.toString() : String(out.owner)

  return {
    id,
    owner,
    name: String(out.name ?? ""),
    metadataUri: String(out.metadata_uri ?? ""),
    paramsHash: String(out.params_hash ?? ""),
    active: Boolean(out.active),
  } satisfies RegistryAlgo
}

export async function fetchRegistryAlgos(limit = 20) {
  const total = await fetchRegistryTotalAlgos()
  const max = Math.min(total, limit)

  const results: RegistryAlgo[] = []
  for (let i = 0; i < max; i++) {
    const algo = await fetchRegistryAlgo(i)
    if (algo) results.push(algo)
  }

  return results
}
