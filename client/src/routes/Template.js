const express = require('express')
const axios = require('axios');
const key = require('./../keys');
const Router = express.Router();

const base_url = 'https://opzvmjx033.execute-api.us-east-1.amazonaws.com/v1/';

async function createTemplate(name,cap,type,mutable,immutable)
{
    const url = base_url + 'template/create';
    const headers = {
    'x-api-key': key,
    'Content-Type': 'application/json;charset=UTF-8'
    };

    data = { 
        name: name,
        cap: cap,
        type: type, 
        props: {
            immutable: immutable,
            mutable: mutable,
        },
    };

    const res = await axios({method: 'post', url, headers, data})
    return res;
}
Router.get('/',(req,res)=>{
    res.send('Hello!')
})
Router.post('/create',async (req,res)=>{
    try{
        const temp = await createTemplate(req.body.name,req.body.cap,req.body.type,req.body.mutable,req.body.immutable)
        console.log(temp)
        res.status(200).json(temp.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error creating template');
    }
})
module.exports=Router;