const express = require('express');
const {requireUser} = require('./utils');
const { getAllPosts, createPost } = require('../db');
const postsRouter = express.Router();

postsRouter.use((req, res, next)=>{
    console.log("A request is being made to /posts");
    
    next();
})

postsRouter.get("/", async (req,res)=>{
    const posts = await getAllPosts();

    res.send({
        posts
    });
});

postsRouter.post("/", requireUser, async (req, res, next) =>{
    const {authorId, title, content, tags = ""} = req.body;
    const tagArr = tags.trim().split(/\s+/);
    const postData = {};

    //only send the tags if there are some to send
    if(tagArr.length)
    {
        postData.tags = tagArr;
    }

    try{
        postData.authorId = authorId;
        postData.title = title;
        postData.content = content;
        
        const post = await createPost(postData);

        if(post)
        {
            res.send({post});
        }else{
            next({ 
                name: 'ErrorCreatingPost', 
                message: 'The post template was missing needed information.'
              })
        }

    }catch({name, message}){
        next({name, message});
    }
});

module.exports = postsRouter;