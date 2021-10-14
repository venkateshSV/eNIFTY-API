const express = require('express')
const axios = require('axios');
const key = require('./../keys');
const Router = express.Router();

const base_url = 'https://opzvmjx033.execute-api.us-east-1.amazonaws.com/v1/';

async function offerTrade(fromPlayerId,fromTokens,toPlayerId,toTokens)
{
    const url = base_url + 'trade/offer';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };

    data = {
        fromPlayerId: fromPlayerId,
        fromTokens: fromTokens,
        toPlayerId: toPlayerId,
        toTokens: toTokens
    };
    const res = await axios({method: 'post', url, headers, data})
    return res;
}

async function acceptTrade(tradeId)
{
    const url = base_url + 'trade/accept';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };

    let data = {tradeId: tradeId};

    const res = await axios({method: 'post', url, headers, data})
    return res;
}

async function cancelTrade(tradeId)
{
    const url = base_url + 'trade/cancel';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };

    let params = {tradeId: tradeId};

    const res = await axios({method: 'delete', url, headers, params})
    return res;
}

async function getTrade(tradeIds)
{
    const url = base_url + 'trade/get';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };

    let params = {tradeIds: tradeIds};

    const res = await axios({method: 'get', url, headers, params})
    return res;
}

Router.get('/',(req,res)=>{
    res.send('Hello!')
})
Router.post('/offer',async (req,res)=>{
    try{
        const trade = await offerTrade(req.body.fromPlayerId,req.body.fromTokens,req.body.toPlayerId,req.body.toTokens)
        console.log(trade)
        res.status(200).json(trade.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error Offering Trade');
    }
})
Router.post('/accept',async (req,res)=>{
    try{
        const trade = await acceptTrade(req.body.tradeId)
        console.log(trade)
        res.status(200).json(trade.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error Accepting Trade');
    }
})
Router.delete('/cancel',async (req,res)=>{
    try{
        const trade = await cancelTrade(req.body.tradeId)
        console.log(trade)
        res.status(200).json(trade.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error Cancelling Trade');
    }
})
Router.get('/get',async (req,res)=>{
    try{
        const trade = await getTrade(req.body.tradeIds)
        console.log(trade)
        res.status(200).json(trade.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error getting Trades');
    }
})
module.exports=Router;