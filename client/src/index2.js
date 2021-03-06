
const solanaweb3 = require('@solana/web3.js')
const fs = require('mz/fs')
const path = require('path')
const borsh = require('borsh')
const os = require('os')
const yaml = require('yaml')
const Keypair = require('@solana/web3.js').Keypair;
const Connection = require('@solana/web3.js').Connection;
const solana_spl_token = require('@solana/spl-token');

async function getPrice(){
  console.log('Getting data from ', readingPubkey.toBase58())
  const priceFeedAccount = "FmAmfoyPXiA8Vhhe6MZTr3U6rZfEZ1ctEHay1ysqCqcf"
  const AggregatorPublicKey = new PublicKey(priceFeedAccount)
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: readingPubkey, isSigner: false, isWritable: true },
    { pubkey: AggregatorPublicKey, isSigner: false, isWritable: false }],
    programId,
    data: Buffer.alloc(0), // All instructions are hellos
  })
  await solanaweb3.sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payer],
  )
}

async function reportPrice(){
  // const priceFeedAccount = "FmAmfoyPXiA8Vhhe6MZTr3U6rZfEZ1ctEHay1ysqCqcf"
  // const AggregatorPublicKey = new PublicKey(priceFeedAccount)
  const accountInfo = await connection.getAccountInfo(readingPubkey)
  if (accountInfo === null) {
    throw new Error('Error: cannot find the aggregator account')
  }
  const latestPrice = borsh.deserialize(
    AggregatorSchema,
    AggregatorAccount,
    accountInfo.data,
  )
  console.log("Current price of SOL/USD is: ", latestPrice.answer.toString())
}

async function newAccountWithLamports(
  connection = new Connection,
  lamports = 1000000,
){
  const keypair = Keypair.generate()
  const signature = await connection.requestAirdrop(
    keypair.publicKey,
    lamports,
  )
  await connection.confirmTransaction(signature)
  return keypair
}

async function getConfig(){
  const CONFIG_FILE_PATH = path.resolve(
    os.homedir(),
    '.config',
    'solana',
    'cli',
    'config.yml',
  )
  const configYml = await fs.readFile(CONFIG_FILE_PATH, { encoding: 'utf8' })
  return yaml.parse(configYml)
}

async function getRpcUrl(){
  try {
    const config = await getConfig()
    if (!config.json_rpc_url) throw new Error('Missing RPC URL')
    return config.json_rpc_url
  } catch (err) {
    console.warn(
      'Failed to read RPC url from CLI config file, falling back to localhost',
    )
    return 'http://localhost:8899'
  }
}

async function getPayer(){
  try {
    const config = await getConfig()
    if (!config.keypair_path) throw new Error('Missing keypair path')
    return createKeypairFromFile(config.keypair_path)
  } catch (err) {
    console.warn(
      'Failed to create keypair from CLI config file, falling back to new random keypair',
    )
    return Keypair.generate()
  }
}

async function createKeypairFromFile(
  filePath
){
  const secretKeyString = await fs.readFile(filePath, { encoding: 'utf8' })
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString))
  return Keypair.fromSecretKey(secretKey)
}

 

const PublicKey = solanaweb3.PublicKey;
const LAMPORTS_PER_SOL = solanaweb3.LAMPORTS_PER_SOL;
const Transaction = solanaweb3.Transaction;
const TransactionInstruction = solanaweb3.TransactionInstruction;
const SystemProgram = solanaweb3.SystemProgram;
const sendAndConfirmTransaction = solanaweb3.sendAndConfirmRawTransaction;
const PROGRAM_PATH = path.resolve(__dirname, '../../target/deploy')
const SOLANA_WALLET = path.resolve(__dirname, '../../solana-wallet')
const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'chainlink_solana_demo.so')
const PROGRAM_KEYPAIR_PATH = path.join(PROGRAM_PATH, 'chainlink_solana_demo-keypair.json')
let connection = null;
let payer = null;
let programId = null;
let readingPubkey = null;


async function establishConnection(){
   const rpcUrl = await getRpcUrl()
   connection = new Connection(rpcUrl, 'confirmed')
   const version = await connection.getVersion()
   console.log('Connection to cluster established:', rpcUrl, version)
   return
}

async function establishPayer(){
   let fees = 0
   if (!payer) {
     const { feeCalculator } = await connection.getRecentBlockhash()
     fees += await connection.getMinimumBalanceForRentExemption(USER_SIZE)
     fees += feeCalculator.lamportsPerSignature * 100 
     try {
       payer = await getPayer()
       console.log(payer+'2');
     } catch (err) {
       payer = await newAccountWithLamports(connection, fees)
     }
   }
   console.log(payer+'1');
   const lamports = await connection.getBalance(payer.publicKey)
   if (lamports < fees) {
     const sig = await connection.requestAirdrop(
       payer.publicKey,
       fees - lamports,
     )
     await connection.confirmTransaction(sig)
   }
 
   console.log(
     'Using account',
     payer.publicKey.toBase58(),
     'containing',
     lamports / LAMPORTS_PER_SOL,
     'SOL to pay for fees',
   )
}
 
async function checkProgram(){
   try {
     const programKeypair = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH)
     programId = programKeypair.publicKey
   } catch (err) {
     const errMsg = (err).message
     throw new Error(
       `Failed to read program keypair at '${PROGRAM_KEYPAIR_PATH}' due to error: ${errMsg}. Program may need to be deployed with \`solana program deploy target/deploy/chainlink_solana_demo.so --keypair solana-wallet/keypair.json\``,
     )
   }
   const programInfo = await connection.getAccountInfo(programId)
   if (programInfo === null) {
     if (fs.existsSync(PROGRAM_SO_PATH)) {
       console.log(PROGRAM_SO_PATH)
       throw new Error(
         'Program needs to be deployed with `solana program deploy target/deploy/chainlink_solana_demo.so --keypair solana-wallet/keypair.json`',
       )
     } else {
       throw new Error('Program needs to be built and deployed')
     }
   }
   console.log(`Using program ${programId.toBase58()}`)
   const GREETING_SEED = 'hello'
   readingPubkey = await PublicKey.createWithSeed(
     payer.publicKey,
     GREETING_SEED,
     programId,
   )
   const priceFeedAccount = await connection.getAccountInfo(readingPubkey)
   if (priceFeedAccount === null) {
     console.log(
       'Creating account',
       readingPubkey.toBase58(),
       'to read from',
     )
     const lamports = await connection.getMinimumBalanceForRentExemption(
       USER_SIZE,
     )
 
     const transaction = new Transaction().add(
       SystemProgram.createAccountWithSeed({
         fromPubkey: payer.publicKey,
         basePubkey: payer.publicKey,
         seed: GREETING_SEED,
         newAccountPubkey: readingPubkey,
         lamports,
         space: USER_SIZE,
         programId,
       }),
     )
     console.log(transaction);
     console.log(transaction.instructions[0].data);
     await solanaweb3.sendAndConfirmTransaction(connection, transaction, [payer])
   }
}
 

class UserAccount {
  email = '';
  password = '';
  constructor(fields){
    if(fields){
      this.email = fields.email;
      this.password = fields.password;
    }
  }
}
 const UserSchema = new Map([
    [UserAccount, {kind: 'struct', fields: [['email', 'string'],['password', 'string']]}]
 ])  
 
 const USER_SIZE = borsh.serialize(
  UserSchema,
  new UserAccount(),
 ).length
 
 class AggregatorAccount {
  answer = 0;
  constructor(fields) {
    if (fields) {
      this.answer = fields.answer
    }
  }
}

// Borsh schema definition for greeting accounts
const AggregatorSchema = new Map([
  [AggregatorAccount, { kind: 'struct', fields: [['answer', 'u128']] }],
])

/**
 * The expected size of each greeting account.
 */
const AGGREGATOR_SIZE = borsh.serialize(
  AggregatorSchema,
  new AggregatorAccount(),
).length

async function signUpUser(email){
  const USER_SEED = email;  //repalce with mongoDB id;
  readingPubkey = await PublicKey.createWithSeed(
    payer.publicKey,
    USER_SEED,
    solana_spl_token.TOKEN_PROGRAM_ID,
  );
  const userAccount = await connection.getAccountInfo(readingPubkey)
  if(userAccount != null)
  {
    throw new Error('User with same credentials already exists. Try logging in');
  }
  else
  {
    const lamports = await connection.getMinimumBalanceForRentExemption(
      USER_SIZE,
    );

    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: payer.publicKey,
        basePubkey: payer.publicKey,
        seed: USER_SEED,
        newAccountPubkey: readingPubkey,
        lamports,
        space: USER_SIZE,
        programId: solana_spl_token.TOKEN_PROGRAM_ID,
      }),
    )
    console.log(transaction);
    console.log(transaction.instructions[0].data);
    await solanaweb3.sendAndConfirmTransaction(connection, transaction, [payer])
    return readingPubkey;
  }
}

async function loginUser(email){
  const USER_SEED = email;
  readingPubkey = await PublicKey.createWithSeed(
    payer.publicKey,
    USER_SEED,
    solana_spl_token.TOKEN_PROGRAM_ID,
  );
  const userAccount = await connection.getAccountInfo(readingPubkey)
  if(userAccount == null)
  {
    throw new Error('User does not exist. Try signing up!');
  }
  else
  {
    console.log(userAccount);
    console.log(readingPubkey.toBase58());
    return readingPubkey;
  }
}


async function sendMoneyFromAccount(fromWallet,toPubkey,amount)
{
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: toPubkey,
      lamports: amount,
    }),
  )
  await solanaweb3.sendAndConfirmTransaction(connection, transaction, [fromWallet])
  console.log('DONE');
  return;
}

async function createToken(toWallet,amount)
{
  const wallet = toWallet;
  let mint = await solana_spl_token.Token.createMint(
    connection,
    wallet,
    wallet.publicKey,
    null,
    100,
    solana_spl_token.TOKEN_PROGRAM_ID
  );
  console.log(mint.publicKey.toBase58());
  console.log(mint);
  let token_account = await mint.getOrCreateAssociatedAccountInfo(wallet.publicKey,);
  console.log(token_account);
  console.log(token_account.owner.toBase58())
  await mint.mintTo(
    token_account.address,
    wallet.publicKey,
    [],
    amount,
  );
  await mint.setAuthority(
    mint.publicKey,
    null,
    'MintTokens',
    wallet.publicKey,
    []
  )
  return mint;
}

async function createWallet()
{
  return Keypair.generate();
}

async function sendToken(mint,fromWallet,toPubkey,amount)
{
  let to_account = await mint.getOrCreateAssociatedAccountInfo(toPubkey);
  let from_account = await mint.getOrCreateAssociatedAccountInfo(fromWallet.publicKey);
  const transaction = new Transaction().add(
    solana_spl_token.Token.createTransferInstruction(
      solana_spl_token.TOKEN_PROGRAM_ID,
      from_account.address,
      to_account.address,
      fromWallet.publicKey,
      [],
      amount,
    )
  )
  const _signature = await solanaweb3.sendAndConfirmTransaction(
    connection,
    transaction,
    [fromWallet],
    {commitment: 'confirmed'}
  )
  console.log(_signature)
  return;
}

async function getNFTOwnership(mint,wallet)
{
  let account = await mint.getOrCreateAssociatedAccountInfo(wallet.publicKey);
  console.log(account.amount/LAMPORTS_PER_SOL)
}


async function main() {
  console.log("Let's work with Solana...")
  await establishConnection()
  await establishPayer()
  await checkProgram()
  console.log(key);
  //await getPrice()
  //await reportPrice()

//  await signUpUser('kjain@gmail.com');

 // const loginPubkey = await loginUser('kjain@gmail.com');
 //console.log(loginPubkey.toBase58());

 // const toWallet = await createWallet();
 // console.log(toWallet.publicKey.toBase58());

  /*await sendMoneyFromAccount(payer,toWallet.publicKey,30000000)

  const mint = await createToken(toWallet,100);*/

 /* await sendToken(mint,toWallet,payer.publicKey,50);

  await getNFTOwnership(mint,toWallet)*/

 // const tokenAccount = await mint.getOrCreateAssociatedAccountInfo(toWallet.publicKey)
 
  /*await getNFTOwnership(mint,toWallet);

  await sendMoneyFromAccount(payer,toWallet.publicKey,100000)

  await sendMoneyFromAccount(toWallet,payer.publicKey,1000)

  const toWallet2 = await createWallet();
  await sendMoneyFromAccount(toWallet,toWallet2.publicKey,1000)*/

  console.log('SUCCESS')
}

main().then(
  () => process.exit(),
  err => {
    console.error(err)
    process.exit(-1)
  },
)
