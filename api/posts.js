const express = require('express');
const {requireUser} = require('./utils');
const { getAllPosts, createPost, updatePost, getPostById } = require('../db');
const postsRouter = express.Router();

postsRouter.use((req, res, next)=>{
    console.log("A request is being made to /posts");
    
    next();
})

postsRouter.get("/", async (req,res, next)=>{
   try { 
    const allPosts = await getAllPosts(); 

    const posts = allPosts.filter(post => { 
 // keep a post if it is either active or belongs to the current user 
  
  //return post ?  post.active == true || posts.author.id == req.user.id:

  if (post.active) { 
    return true;
  }

  if (req.user && post.author.id === req.user.id) {
    return true; 
  }
return false

    });

     res.send({ 
        posts
      })

   } catch ({ name, message }) {
    next({ name, message });
   }
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

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
    const { postId} = req.params;
    const {title, content, tags} = req.body; 

   const updateFields = {}; 
   
   if (tags && tags.length > 0) {
    updateFields.tags = tags.trim().split(/\s+/);
   }

   if (title) {
    updateFields.title = title;
   }
   
   if (content) {
    updateFields.content = content;
   }

   try { 
    const originalPost = await getPostById(postId);

    if (originalPost.author.id === req.user.id) {
        const updatedPost = await updatePost(postId, updateFields);
        res.send({ post: updatedPost })
    } else {
        next ({ 
            name: 'UnauthorizedUserError',
            message: 'You cannot update a post that is not yours.'
        })
    }
   } catch ({ name, message }) {
   next({name, message});
}
}); 

postsRouter.delete('/:postId', requireUser, async (req, res, next) =>{
    try{
        const post = await getPostById(req.params.postId);

        if(post && post.author.id === req.user.id){
            const updatedPost = await updatePost(post.id, {active: false});

            res.send({post: updatedPost});
        }else{
            //if there was a post, throw UnathorizedUserError, otherwise throw PostNotFoundError
            next(post ? {
                name: "UnauthorizedUserError",
                message: "You cannont delete a post which is not yours"
            } : {
                name: "PostNotFoundError",
                message: "That post does not exist"
            });
        }

    }catch({name, message}){
        next({name, message})
    }
});



module.exports = postsRouter;