const SCRIPT_ID=""
const BASE='http://results.ranker.com/?keywords='
let result=[]
let keyword="";
let id=0;
let urls=[];

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
	sendResponse("From background")
	if(id){
		if(message.type==="links"){
			//console.log("Got links",message.links)
			const timestamp=getTimeNow();
			result.push({keyword,res:message.links,timestamp})
			if(urls.length){
				keyword=urls.shift()
				chrome.tabs.update(id,{url:BASE+keyword},(tab)=>{})
			}else{
					downloadResult()
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
		//startScraping();
		//({keyword,urls,id}=message.data)
	}
	
})

function fetchTime(){
	chrome.storage.local.get("time",data=>{
			const periodInMinutes=+data.time||60;
			chrome.alarms.create("timer",{periodInMinutes})
		})
		startScraping();
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
			const response=await (await fetch(SCRIPT_ID)).json()
			//console.log("Reponse",response)
			urls=response;
			urls.shift()
			keyword=urls.shift();
			createTab();
		}
	})
}

function createTab(){
	
	chrome.tabs.create({url:BASE+keyword},tab=>{
					id=tab.id;
				})
}



function downloadResult(){
	const body=result.map(item=>[item.keyword,item.timestamp,...item.res])
	console.log(JSON.stringify(body))
	fetch(SCRIPT_ID,{method:"POST",headers:{"content-type":"Application/json"},body:JSON.stringify(body)}).then(data=>console.log(i=data))
	result=result.map(item=>([JSON.stringify(item.keyword),item.timestamp,...item.res]).join(","))
	result.splice(0,0,"keyword,timestamp, url1,url2,url3,url4,url5,url6")
	result=result.join("\n")
	blob=new Blob([result],{type:"text/csv"});
	dataUrl=URL.createObjectURL(blob)
	result=[]
	keyword=""
	const now=new Date()
	const filename="ranker/"+now.toDateString()+" "+getTimeNow(",") +".csv";
	//console.log("Filename",filename)
	chrome.downloads.download({url:dataUrl,filename},()=>{
		console.log("Downloaded")
		chrome.tabs.remove(id)
		id=0;
	})
	
}

function getTimeNow(delemiter=":"){
	const now=new Date()
	const timestamp=now.getUTCHours()+delemiter+now.getUTCMinutes()+delemiter+now.getUTCSeconds();
	return timestamp;
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
	startScraping();
}

}
chrome.alarms.onAlarm.addListener(handleAlarms)


chrome.alarms.getAll(alarms=>{
	if(!alarms.length){
		fetchTime();
	}
})
