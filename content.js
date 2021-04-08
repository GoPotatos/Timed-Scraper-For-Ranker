let counter=0
let timer=0;
window.onload=()=>{
	timer=setInterval(function(){
	links=Array.from(document.querySelectorAll("[data-ads] .text-sm")).map(item=>item.innerText)
	notFound=document.querySelector(".leading-none")
	counter++;
	if(links.length||!notFound||counter>=10){
		clearInterval(timer)
		chrome.runtime.sendMessage(chrome.runtime.id,{type:"links",links},res=>{})
		}
		//console.log("onload",new Date(),links,chrome.runtime.id)
	},1000)
}
window.onBeforeUnload=function(){
		chrome.runtime.sendMessage(chrome.runtime.id,{type:"close"},res=>{})
		
}