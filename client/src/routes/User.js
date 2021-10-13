const express = require('express')
const axios = require('axios');
const key = require('./../keys');
const Router = express.Router();

const base_url = 'https://opzvmjx033.execute-api.us-east-1.amazonaws.com/v1/';

async function create_User(email,password,userData)
{
    const url = base_url + 'player/create';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
    
    let data = { 
      uniqueId: email,
      password: password,
      userData: userData
    };
    const res = await axios({method: 'post', url, headers, data})
    return res;
}

async function mutate_User(playerId,props)
{
    const url = base_url + 'player/mutate';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
    let data = { 
      playerId: playerId, 
      props: props
    };
    const res = await axios({method: 'post', url, headers, data})
    return res;
}

async function get_Inventory(playerId)
{
  const url = base_url + 'player/get-inventory';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
  
  let params = {"playerId": playerId};
  
  const res = await axios({method: 'get', url, headers, params,})
  return res;
}

async function get_User(playerId)
{
  const url = base_url + 'player/get';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
  
  let params = {"playerId": playerId};
  
  const res = await axios({method: 'get', url, headers, params,})
  return res;
}

async function getall_User(start,limit)
{
  const url = base_url + 'player/get-all';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
  
  let params = {"start": start, "limit": limit};
  
  const res = await axios({method: 'get', url, headers, params,})
  return res;
}

async function getplayerId(uniqueId)
{
  const url = base_url + 'player/get-id';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
  
  let params = {"uniqueId": uniqueId};
  
  const res = await axios({method: 'get', url, headers, params,})
  return res;
}

async function getPlayerIds()
{
  const url = base_url + 'player/get-ids';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
  
  let params = {};
  
  const res = await axios({method: 'get', url, headers, params,})
  return res;
}

Router.get('/',(req,res)=>{
    res.send('Hello!')
})
Router.post('/create',async (req,res)=>{
    try{
        const user = await create_User(req.body.email,req.body.password,req.body.userData)
        console.log(user)
        res.status(200).json(user.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error creating User');
    }
})
Router.post('/mutate',async (req,res)=>{
  try{
      const mut_user = await mutate_User(req.body.playerId,req.body.props)
      console.log(mut_user)
      res.status(200).json(mut_user.data)
  }catch(err){
      console.log(err);
      res.status(500).send('Error mutating User');
  }
})
Router.get('/get-inventory',async (req,res)=>{
  try{
      const inventory = await get_Inventory(req.body.playerId)
      console.log(inventory)
      res.status(200).json(inventory.data)
  }catch(err){
      console.log(err);
      res.status(500).send('Error getting inventory');
  }
})
Router.get('/get',async (req,res)=>{
  try{
      const user = await get_User(req.body.playerId)
      console.log(user)
      res.status(200).json(user.data)
  }catch(err){
      console.log(err);
      res.status(500).send('Error getting User');
  }
})
Router.get('/get-all',async (req,res)=>{
  try{
      const user = await getall_User(req.body.start,req.body.limit)
      console.log(user)
      res.status(200).json(user.data)
  }catch(err){
      console.log(err);
      res.status(500).send('Error getting all User data');
  }
})
Router.get('/get-id',async (req,res)=>{
  try{
      const user = await getplayerId(req.body.uniqueId)
      console.log(user)
      res.status(200).json(user.data)
  }catch(err){
      console.log(err);
      res.status(500).send('Error getting player id');
  }
})
Router.get('/get-ids',async (req,res)=>{
  try{
      const user = await getPlayerIds()
      console.log(user)
      res.status(200).json(user.data)
  }catch(err){
      console.log(err);
      res.status(500).send('Error getting player ids');
  }
})
module.exports=Router;