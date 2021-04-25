const SCRIPT_ID="https://script.google.com/macros/s/AKfycbxeO7WlvGxKh6-1pnsTTqTBcNxM3XrFk7Mvu-k3194oQ62mEjD7WcCR6jv4bULwJ7ioiw/exec"
const BASE='http://results.ranker.com/?keywords='
const VER="2"
const BATCH_COUNT=10;
const REPEAT_COUNT=5;
let interval=0;
let result=[]
let keyword="";
let id=0;
let urls=[];
let counter=0;
let index=0;
let running=false;


chrome.browserAction.setBadgeText({text:VER})
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
	sendResponse("From background")
	if(id){
		if(message.type==="links"){
			//console.log("Got links",message.links)
			const timestamp=getTimeNow();
			const date=(new Date()).toDateString()
			result.push({keyword,res:message.links,timestamp,date})
			if(urls.length){
				if(result.length===BATCH_COUNT){
					downloadResult()
				}
				
				keyword=urls.shift()
				chrome.tabs.update(id,{url:BASE+keyword},(tab)=>{})
			}else{
					downloadResult(()=>{
						const body={result:[" "],type:"links"}
						fetch(SCRIPT_ID,{method:"POST",headers:{"content-type":"Application/json"},body:JSON.stringify(body)}).then(data=>console.log(i=data))
						.catch(err=>console.log("Error Posting Empty row",err))
					})
					keyword=""
					console.log("Downloaded")
					counter--;
					
					chrome.tabs.remove(id)
					id=0;
					if(counter<0){
						console.log("Fatal Error: Counter less than zero",counter)
						counter=0;
					}
					if(counter){
						startScraping();
					}else{
						running=false;
						clearInterval(interval)
					}
			}
			
		}else if(message.type==="stop"){
			stopped=true
			downloadResult()
		}
		}
	
	if(message.type==="start"){
		console.log("Starting scraping")
		chrome.alarms.clearAll();
		fetchTime();
		addToQueue()
		//startScraping();
		//({keyword,urls,id}=message.data)
	}
	
	if(message.type==="modify-interval"){
		chrome.alarms.clearAll();
		counter++;
		fetchTime();
	}
	
})

function fetchTime(){
	chrome.storage.local.get("time",data=>{
			const periodInMinutes=+data.time||60;
			chrome.alarms.create("timer",{periodInMinutes})
		})
		//startScraping();
}

function startScraping(){
	chrome.storage.local.get(["mode","time","urls"],async data=>{
		if(data.mode==="file"){
			if(data.urls){
				urls=data.urls;
				urls.shift()
				keyword=urls.shift();
				createTab();
			}else{
				console.log("No File specified");
			}
		}else{
			try{
			const response=await (await fetch(SCRIPT_ID)).json()
			//console.log("Reponse",response)
			response.shift()
			//urls=[...response,...response,...response];
			urls=duplicateArray(response,REPEAT_COUNT)
			keyword=urls.shift();
			createTab();
			}catch(err){
				console.log("Error fetching links",err)
			}
		}
	})
}

function createTab(){
	
	chrome.tabs.create({url:BASE+keyword},tab=>{
					id=tab.id;
					startCheckup()
				})
}



function downloadResult(callback=function(){}){
	const res=result.map(item=>[item.keyword,item.date,item.timestamp,...item.res])
	const body={result:res,type:"links"}
	console.log(JSON.stringify(body))
	fetch(SCRIPT_ID,{method:"POST",headers:{"content-type":"Application/json"},body:JSON.stringify(body)}).then(callback)
	.catch(err=>callback)
	
	result=result.map(item=>([JSON.stringify(item.keyword),item.timestamp,...item.res]).join(","))
	result.splice(0,0,"keyword,timestamp, url1,url2,url3,url4,url5,url6")
	result=result.join("\n")
	blob=new Blob([result],{type:"text/csv"});
	dataUrl=URL.createObjectURL(blob)
	result=[]
	/*if(counter===0){
		counter=3;
	}else{
		startScraping()
	}*/
	/*
	const now=new Date()
	const filename="ranker/"+now.toDateString()+" "+getTimeNow(",") +".csv";
	//console.log("Filename",filename)
	/chrome.downloads.download({url:dataUrl,filename},()=>{
		console.log("Downloaded")
		chrome.tabs.remove(id)
		id=0;
	})*/
	
}

function getTimeNow(delemiter=":"){
	const now=new Date()
	const timestamp=now.getUTCHours()+delemiter+now.getUTCMinutes()+delemiter+now.getUTCSeconds();
	return timestamp;
}

function duplicateArray(arr,count=1){
const newArr=[]
for(let i=0;i<count;i++){
newArr.push(...arr)
}
return newArr
}

chrome.commands.onCommand.addListener((command)=>{
	if(id){
		chrome.tabs.discard(id,()=>{
			downloadResult()
		})
	}
})

chrome.tabs.onRemoved.addListener((tabId,removed)=>{
	if(id===tabId){
		id=0
	}
})

function handleAlarms(info){
//chrome.downloads.download({url:dataUrl,filename:"ranker/"+info.scheduledTime+".txt"},()=>console.log("Downloaded"))
//console.log("Name",info.name,"Time",info.scheduledTime);
if(info.name==="timer"){
	addToQueue()
}

}
chrome.alarms.onAlarm.addListener(handleAlarms)


chrome.alarms.getAll(alarms=>{
	if(!alarms.length){
		fetchTime();
		startScraping()
	}
})



function handleConnection(port){
if(port.name==="script.js"){
console.log("Connected Sucessfully",port)
port.onDisconnect.addListener(port2=>{
console.log("Port was disconnected",running,port2)
})
}else{
console.log("Unrecognized Port",port)
}
}
chrome.runtime.onConnect.addListener(handleConnection)

function startCheckup(){
	clearInterval(interval)
	interval=setInterval(()=>{
		if(running){
			
			chrome.tabs.get(id,tab=>{
				//console.log("Tab found",tab.status)
					if(chrome.runtime.lastError){
						counter=0;
						running=false;
						if(id===0){
							console.log("Tab closed probably",chrome.runtime.lastError.message,tab)
						}else{
							console.log("Tab crashed probably",chrome.runtime.lastError.message,tab)
						}
						clearInterval(interval)
						return;
					}
					if(tab.status==="unloaded"){
						counter=0;
						running=false;
						console.log("Tab crashed unloaded",tab)
						const res="YSA"+VER;
						const body={type:"crash-report",result:res};
						fetch(SCRIPT_ID,{method:"POST",body:JSON.stringify(body),headers:{"content-type":"Application/json"}})
						.catch(err=>console.log("Error sending crash report",err))
						clearInterval(interval)
						chrome.tabs.remove(id,()=>{
							id=0;
							result=[];
							addToQueue()
						})
						
						
					}
				})
			
		}else{
			clearInterval(interval)
		}
	},3000)
}


function addToQueue(){
	if(running){
		counter++;
	}else{
		running=true;
		startScraping()
	}
}