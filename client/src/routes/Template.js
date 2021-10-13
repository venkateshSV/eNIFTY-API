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

async function mutate_Template(templateId,props)
{
    const url = base_url + 'template/mutate';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
    
    data = { 
      templateId: templateId, 
      props: props
    };
    
    const res = await axios({method: 'put', url, headers, data})
    return res;

}

async function remove_Template(templateId)
{
    const url = base_url + 'template/remove';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
    
    params = {templateId: templateId};
    
    const res =await axios({method: 'delete', url, headers, params})
    return res;
}

async function get_Template(templateId)
{
    const url = base_url + 'template/get';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
    
    params = {templateId: templateId};
    
    const res =await axios({method: 'get', url, headers, params})
    return res;
}

async function getall_Template(start,limit)
{
    const url = base_url + 'template/get-all';
    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json;charset=UTF-8'
    };
    
    let params = {start: start, limit: limit};
    
    const res =await axios({method: 'get', url, headers, params})
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
Router.put('/mutate',async (req,res)=>{
    try{
        const mutateTemplate = await mutate_Template(req.body.templateId,req.body.props)
        console.log(mutateTemplate)
        res.status(200).json(mutateTemplate.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error mutating template');
    }
})
Router.delete('/remove',async (req,res)=>{
    try{
        const removeTemplate = await remove_Template(req.body.templateId)
        console.log(removeTemplate)
        res.status(200).json(removeTemplate.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error removing template');
    }
})
Router.get('/get',async (req,res)=>{
    try{
        const getTemplate = await get_Template(req.body.templateId)
        console.log(getTemplate)
        res.status(200).json(getTemplate.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error getting template');
    }
})
Router.get('/get-all',async (req,res)=>{
    try{
        const getallTemplate = await getall_Template(req.body.start,req.body.limit)
        console.log(getallTemplate)
        res.status(200).json(getallTemplate.data)
    }catch(err){
        console.log(err);
        res.status(500).send('Error getting all templates');
    }
})
module.exports=Router;