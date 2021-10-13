const express = require('express')
const axios = require('axios');
const key = require('./../keys');
const Router = express.Router();

const base_url = 'https://opzvmjx033.execute-api.us-east-1.amazonaws.com/v1/';

async function mintToken(playerId,templateId,amount,mutable,immutable)
{
    const url = base_url + 'token/mint';
    const headers = {
        'x-api-key': key,
        'Content-Type': 'application/json;charset=UTF-8'
      };
      
      const data = { 
        playerId: playerId, 
        tokenObjects: [
              {
                  templateId: templateId,
                  amount:amount,
                  props: {
                    mutable: mutable,
                    immutable: immutable,
                },
              }
          ],
      };
      
      const res = await axios({method: 'post', url, headers, data})
      return res;
}
async function mintGet_All(tokenId)
{
    const url = base_url + 'token/mint/get-all';
    const headers = {
    'x-api-key': key,
    'Content-Type': 'application/json;charset=UTF-8'
    };

    params = {"tokenId": tokenId};

    const res = await axios({method: 'get', url, headers, params})
    return res;
}

async function burn_Token(playerId,tokenId,amount)
{   
    const url = base_url + 'token/burn';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
    
    data = { 
      playerId: playerId,
      tokenObjects: [{'tokenId': tokenId, 'amount': amount}] 
    };
             
    const res = axios({method: 'post', url, headers, data})
    return res;
}

async function mutate_Token(tokenId,props)
{
    const url = base_url + 'token/mutate';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
    
    data = { 
      tokenId: tokenId, 
      props: props
    };
    
    const res = axios({method: 'put', url, headers, data})
    return res;
}

async function transfer_Token(fromPlayerId,toPlayerId,tokenId,amount)
{
    const url = base_url + 'token/transfer';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
    
    let data = {
        fromPlayerId: fromPlayerId,
        toPlayerId:   toPlayerId,
        tokenObjects: [{tokenId: tokenId, amount: amount}]
    };
    
    const res = axios({method: 'post', url, headers, data})
    return res;  
}
async function get_Token(tokenIds)
{
    const url = base_url + 'token/get';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
    
    params = {"tokenIds": tokenIds};
    
    const res = axios({method: 'get', url, headers, params})
    return res;
}

async function getall_Token(templateId)
{
    const url = base_url + 'token/get-all';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
    
    params = {"templateId": templateId};
    
    const res = axios({method: 'get', url, headers, params})
    return res;
}

Router.get('/',(req,res)=>{
    res.send('Hello!')
})
Router.post('/mint',async (req,res)=>{
    try{
        const token = await mintToken(req.body.playerId,req.body.templateId,req.body.amount,req.body.mutable,req.body.immutable)
        console.log(token)
        res.status(200).json(token.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error minting token');
    }
})
Router.get('/mint/get-all',async (req,res)=>{
    try{
        const mintGetAll = await mintGet_All(req.body.tokenId)
        console.log(mintGetAll)
        res.send(mintGetAll.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error getting all minted tokens');
    }
})
Router.post('/burn',async(req,res)=>{
    try{
        const burnToken= await burn_Token(req.body.playerId,req.body.tokenId,req.body.amount)
        console.log(burnToken)
        res.status(200).json(burnToken.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error removing token');
    }
})
Router.put('/mutate',async(req,res)=>{
    try{
        const mutateToken= await mutate_Token(req.body.tokenId,req.body.props)
        console.log(mutateToken)
        res.status(200).json(mutateToken.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error mutating token');
    }
})
Router.post('/transfer',async(req,res)=>{
    try{
        const transferToken= await transfer_Token(req.body.fromPlayerId,req.body.toPlayerId,req.body.tokenId,req.body.amount)
        console.log(transferToken)
        res.status(200).json(transferToken.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error transferring token');
    }
})
Router.get('/get',async (req,res)=>{
    try{
        const getToken = await get_Token(req.body.tokenIds)
        console.log(getToken)
        res.send(getToken.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error getting token properties');
    }
})
Router.get('/get-all',async (req,res)=>{
    try{
        const getallToken = await getall_Token(req.body.templateId)
        console.log(getallToken)
        res.send(getallToken.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error retrieving token information');
    }
})
module.exports=Router;