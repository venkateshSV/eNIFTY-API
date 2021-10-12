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
async function mintGetAll()
{
    const url = base_url + 'token/mint';
}

Router.get('/',(req,res)=>{
    res.send('Hello!')
})
Router.post('/mint',async (req,res)=>
{
    try{
        const token = await mintToken(req.body.playerId,req.body.templateId,req.body.amount,req.body.mutable,req.body.immutable)
        console.log(token)
        res.status(200).json(token.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error minting token');
    }
})

module.exports=Router;