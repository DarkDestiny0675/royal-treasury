import { getAuthToken } from "../auth/authSession";
const BASE=import.meta.env.VITE_API_BASE_URL||"http://localhost:3001";
async function request(path,options={}){const response=await fetch(`${BASE}/api/community${path}`,{cache:"no-store",...options,headers:{"Content-Type":"application/json",Authorization:`Bearer ${getAuthToken()}`,...(options.headers||{})}});const payload=await response.json().catch(()=>({}));if(!response.ok){const error=new Error(payload.message||"Community request failed.");error.status=response.status;throw error;}return payload;}
export const listCommunityPosts=(filters={})=>request(`?${new URLSearchParams(Object.entries(filters).filter(([,v])=>v&&v!=="all"))}`);
export const loadCommunityPost=(id)=>request(`/${encodeURIComponent(id)}`);
export const createCommunityPost=(input)=>request('',{method:'POST',body:JSON.stringify(input)});
export const addCommunityReply=(id,body)=>request(`/${encodeURIComponent(id)}/replies`,{method:'POST',body:JSON.stringify({body})});
export const voteCommunityPost=(id,vote)=>request(`/${encodeURIComponent(id)}/vote`,{method:'PUT',body:JSON.stringify({vote})});

export const getCommunityAccess=()=>request('/me');
export const moderateCommunityPost=(id,input)=>request(`/${encodeURIComponent(id)}/moderation`,{method:'PATCH',body:JSON.stringify(input)});
export const deleteCommunityPost=(id)=>request(`/${encodeURIComponent(id)}`,{method:'DELETE'});
export const deleteCommunityReply=(postId,replyId)=>request(`/${encodeURIComponent(postId)}/replies/${encodeURIComponent(replyId)}`,{method:'DELETE'});
