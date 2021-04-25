const BASE='http://results.ranker.com/?keywords='
urls=[]
let result=[]
let keyword="";
let id=null;
//chrome.runtime.connect({name:"script.js"})
window.onload=()=>{
	console.log("Loaded")
	
	const form=document.forms[0]
	const file=document.querySelector("#file")
	const btn=document.querySelector("#btn");
	const interval=document.getElementById("interval")
	const fileOption=document.getElementsByName("mode")[0]
	const sheetOption=document.getElementsByName("mode")[1]
	chrome.storage.local.get(["time","mode"],data=>{
		if(data.time){
			interval.value=data.time;
			console.log("Setting Mode",data)
		}
		if(data.mode){
			if(data.mode==="sheet"){
				fileOption.checked=false;
				sheetOption.checked=true;
			}else{
				sheetOption.checked=false;
				fileOption.checked=true;
			}
		}
	})
	file.onchange=function(e){
		form.onsubmit(e)
	}
	
	interval.oninput=function(e){
		//console.log("inputting",this.value)
		updateStorage({time:this.value},modifyInterval.bind(null,this.value))
	}
	
	fileOption.oninput=handleRadioChange;
	sheetOption.oninput=handleRadioChange;
	btn.onclick=function(){
		sendMessage();
	}
	form.onsubmit=function(e){
		
		e.preventDefault()
		if(file.files.length){
			reader=new FileReader()
			reader.onload=(e)=>{
			urls=reader.result.split(/\r?\n\r?/)
			//urls.shift()
			//const keyword=urls.shift()
			const data={urls};
			const mode=interval.value;
			//updateStorage({urls,mode})
			//keyword=text
			//updateTab(urls,keyword)
			updateStorage({urls},sendMessage)
			
			}
			reader.readAsText(file.files[0])
			
			
		}

	}
}

function updateStorage(data,callback=function(){}){
	console.log("Data",data)
	chrome.storage.local.set(data,callback)
}
function handleRadioChange(){
	const mode=document.querySelector("[name=mode]:checked").value;
		updateStorage({mode})
}
function updateTab(urls,keyword){
	chrome.tabs.update({url:BASE+keyword},(tab)=>{
		const id=tab.id
		const data={keyword,urls,id}	
		chrome.runtime.sendMessage({type:"start",data})
		window.close()
	})
}

function sendMessage(){
	chrome.runtime.sendMessage({type:"start"})
		window.close()
	
}


function modifyInterval(minutes){
	chrome.runtime.sendMessage({type:"modify-interval",minutes})
}

chrome.runtime.onMessage.addListener(handleMessages)

function handleMessages(message,sender,sendResponse){
	console.log(message,tab)
	sendResponse("Got it")
}