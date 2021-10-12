
const solanaweb3 = require('@solana/web3.js')
const fs = require('mz/fs')
const path = require('path')
const borsh = require('borsh')
const os = require('os')
const yaml = require('yaml')
const Keypair = require('@solana/web3.js').Keypair;
const Connection = require('@solana/web3.js').Connection;
const solana_spl_token = require('@solana/spl-token');
const key = require('./keys');
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
//const express = require('express')
const axios = require('axios');
const WalletData = require('./models/WalletModel')

var app = express()
app.use(express.json());
app.use(bodyParser());

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://127.0.0.1/blog_database');
mongoose.connection.on('error', (error) => {
  console.log(error);
});
mongoose.connection.on("connected", () => {
  console.log("Database connected!");
});



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
  
class AggregatorAccount {
  answer = 0;
  constructor(fields) {
    if (fields) {
      this.answer = fields.answer
    }
  }
}

const AggregatorSchema = new Map([
  [AggregatorAccount, { kind: 'struct', fields: [['answer', 'u128']] }],
])

const AGGREGATOR_SIZE = borsh.serialize(
  AggregatorSchema,
  new AggregatorAccount(),
).length

async function getPrice(){
  console.log('Getting data from ', readingPubkey.toBase58())
  const priceFeedAccount = "FmAmfoyPXiA8Vhhe6MZTr3U6rZfEZ1ctEHay1ysqCqcf"
  const AggregatorPublicKey = new PublicKey(priceFeedAccount)
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: readingPubkey, isSigner: false, isWritable: true },
    { pubkey: AggregatorPublicKey, isSigner: false, isWritable: false }],
    programId,
    data: Buffer.alloc(0),
  })
  try{
    const signature = await solanaweb3.sendAndConfirmTransaction(
      connection,
      new Transaction().add(instruction),
      [payer],
    )
    return {
      'success': true,
      'data': signature
    }  

  }catch(err){
    console.log(err)
    return {
      'success': false,
      'data': null
    }
  }
}

async function reportPrice(){
  const accountInfo = await connection.getAccountInfo(readingPubkey)
  if (accountInfo === null) {
    return {
      'success': false,
      'data': null
    }
  }
  const latestPrice = borsh.deserialize(
    AggregatorSchema,
    AggregatorAccount,
    accountInfo.data,
  )
  return {
    'success': true,
    'data': latestPrice
  }
}

async function createWallet()
{
  try{
    const wallet = Keypair.generate();
    return {
      'success': true,
      'data': wallet
    }
  }catch(err){
    console.log(err);
    return {
      'success': false,
      'data': null
    }
  }
}

async function getWallet(key)
{
  try{
    const wallet = Keypair.fromSecretKey(key);
    console.log(wallet.publicKey.toBase58())
    return {
      'success': true,
      'data': wallet
    }
  }catch(err){
    console.log(err);
    return {
      'success': false,
      'data': null
    }
  }
}

async function sendMoneyFromAccount(fromWallet,toWallet,amount)
{
  const balance = await connection.getBalance(fromWallet.publicKey);
  if(balance<amount)
    return {
      'success': false,
      'data': null
    };
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: toWallet.publicKey,
      lamports: amount,
    }),
  )
  try{
    const signature = await solanaweb3.sendAndConfirmTransaction(connection, transaction, [fromWallet])
    console.log('DONE');
    return {
      'success': true,
      'data': signature
    };
  }catch(err){
    console.log(err)
    return {
      'success': false,
      'data': null
    }
  }  
}

const base_url = 'https://opzvmjx033.execute-api.us-east-1.amazonaws.com/v1/'

async function createPlayer(email,name,id)
{
  const url = base_url + 'player/create';
  const headers = {  
    'x-api-key': key,  
    'Content-Type': 'application/json;charset=UTF-8'
  };
  let data = {   
    uniqueId: email,
    userData: {
      'name': name,
      'walletId': id
    }   
  };
  const res = await axios({method: 'post',url,headers,data})
  return res;
}

async function getPlayer(_playerId)
{
  const url = base_url + 'player/get';
  const headers = {  
    'x-api-key': key,  
    'Content-Type': 'application/json;charset=UTF-8'
  };
  let params = {playerId: _playerId};
  const res = await axios({method: 'get',url,headers,params})
  return res;
}

async function getPlayerId(email)
{
  const url = base_url + 'player/get-id';
  const headers = {  
    'x-api-key': key,  
    'Content-Type': 'application/json;charset=UTF-8'
  };
  let params = {uniqueId: email};
  const res = await axios({method: 'get', url, headers, params})
  return res;  
}

async function getInventory(_playerId)
{

  const url = base_url + 'player/get-inventory';
  const headers = {
    'x-api-key': key,
    'Content-Type': 'application/json;charset=UTF-8'
  };
  let params = {playerId: _playerId};
  const res = await axios({method: 'get', url, headers, params,})
  return res;
}



app.get('/',(req,res)=>{
  res.send('Hello!')
})

app.post('/signUp',async (req,res)=>{
  const wallet = await createWallet()
  if(wallet['success']==true)
  {
    var new_item = {
      '_id': new mongoose.Types.ObjectId,
      'keypair': wallet.data.secretKey
    };
    var data = WalletData(new_item);
    data.save(function(err){
        if(err)
        {
          res.status(400).send('Error Storing Wallet'); 
        }
    });
    try{
      const player = await createPlayer(req.body.email,req.body.name,new_item._id)
      console.log(player)
      res.status(200).json(player.data)
    }catch(err){
      res.status(400).send('Error Creating Player');
    }
  }
  else
  {
    res.status(400).send('Error Creating Wallet');
  }
})

app.get('/login',async (req,res)=>{
  try{
    const player = await getPlayer(req.body.playerId)
    console.log(player)
    res.send(player.data)
  }catch(err){
    console.log(err);
    res.status(400).send('Error Getting Player');
  }
})

app.get('/getWallet',async (req,res)=>{
  WalletData.findById(req.body.walletId).exec().then(async function (doc){
    const wallet = await getWallet(Uint8Array.from(doc.keypair[0].buffer));
    if(wallet.success==true)
    {
      res.send(wallet.data);
    }
    else
    {
      console.log(err);
      res.status(400).send('Error Getting Wallet from DB');
    }
  }).catch((err)=>{
    console.log(err);
    res.status(400).send('Error Getting Wallet from DB');
  })
})
//TRIAL
const TokenRoute = require("./routes/Token");
app.use('/token',TokenRoute);
// 
app.listen('8000', function () {
  console.log('Started');
});

