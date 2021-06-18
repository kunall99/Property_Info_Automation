const puppeteer = require("puppeteer");
const fs = require("fs");
const nodemailer = require("nodemailer");
const constructionStatus = "ready to move";
const budget = {                                 
    "min" : "40 Lacs",
    "max" : "5 Crores",
};
let bedroom = ["2","3"];
let locality = "delhi west";
let furnishType = "Unfurnished";
let amenities = "Lift";

(async function(){
    let browser = await puppeteer.launch({
        headless : false,
        defaultViewport : null,
        args : ["--start-maximized"],
        slowMo : 20
    });
    let pages = await browser.pages();
    let tab = pages[0];
    await tab.goto("https://www.99acres.com/");
    await tab.waitForTimeout(2000);
    await tab.click('#keyword');
    if(constructionStatus != null){
        await tab.click('#avail_wrap');
        if(constructionStatus == "Under construction" || constructionStatus == "under construction")
            await tab.click("#under_const");
        else
            await tab.click('#ready_move');
    }
    if(budget != null){
        await tab.click('#budget_wrap');
        let allMinPrice = await tab.$$('#buy_budget_min_wrap .ddlist#buy_minprice a');
        for(let i = 1 ; i < allMinPrice.length ; i++){
            let Price = await tab.evaluate(function(elem){ return elem.textContent ; }, allMinPrice[i]);
            let tag = allMinPrice[i];
            if(Price == budget["min"])
                await tag.click();
        }
        let allMaxPrice = await tab.$$('#s_buy_budget_max #buy_maxprice a');
        for(let i = 1 ; i < allMinPrice.length ; i++){
            let Price = await tab.evaluate(function(elem){ return elem.textContent ; }, allMaxPrice[i]);
            let tag = allMaxPrice[i];
            if(Price == budget["max"])
                await tag.click();
        }
    }
    if(bedroom != null){
        await tab.click('#bedroom_num_wrap');
        let allBedroomType = await tab.$$('#s_bedroom_num a');
        for(let i = 1 ; i < allBedroomType.length ; i++){
            let rooms = await tab.evaluate(function(elem){ return elem.textContent ; }, allBedroomType[i]);
            if(bedroom.includes(rooms.substring(0,1)) == true)
                await tab.click(`#bd_${i}`);
        }
    }
    if(locality != null){
        await tab.click('#keyword');
        await tab.type("#keyword", locality);
        await tab.keyboard.press("Enter");
    }
    await tab.waitForTimeout(3000);
    await tab.waitForSelector('.tags-and-chips__textOnly.undefined.pageComponent', {visible : true});
    let tabs = await tab.$$('.tags-and-chips__textOnly.undefined.pageComponent');
    let verified = tabs[1];
    await verified.click();
    await tab.waitForTimeout(2000);
    if(amenities != null){
        await tab.waitForSelector('.input_placeholder_completed div[variant="anchor"]', {visible : true});
        let options = await tab.$$('.input_placeholder_completed div[variant="anchor"]');
        let moreoption = options[options.length-1];
        await moreoption.click();
        let amenity = await tab.$$(' .input_placeholder_completed div[data-label="AMENITIES_CLUSTER"]');
        for(let i = 0 ; i < amenity.length ; i++){
            let type = await tab.evaluate(function(elem){ return elem.textContent}, amenity[i]);
            if(type == amenities){
                let tag = amenity[i];
                await tag.click();
            }
        }
    }
    if(furnishType != null){
        await tab.waitForSelector('#furnish', {visible : true});
        await tab.click("#furnish");
        let furnishes = await tab.$$('.accordion__acco_wrapper div[data-label="FURNISH_CLUSTER"]');
        for(let i = 0 ; i < 3 ; i++){
            let type = await tab.evaluate(function(elem){ return elem.textContent}, furnishes[i]);
            if(type == furnishType){
                let tag = furnishes[i];
                await tag.click();
            }
        }
    }
    await tab.waitForTimeout(3000);
    await eachPage(browser, tab);
    // for sending mail at last function
    var mailOptions = {
        from: 'tt5061437@gmail.com',
        to: 'guptakunal77@gmail.com',
        subject: 'Property data file',
        html: '<h1>Welcome</h1><p>Here is a file which contains useful information of every property. Link of each house is also there.</p>',
        attachments : [
            {
                filename : "Property.json",
                path : "./Property.json",
            }
        ]
    };
    let resp= await wrapedSendMail(mailOptions);
    console.log(resp);
    return resp;
})();

async function eachPage(browser, tab){
    await tab.waitForSelector('.pageComponent.srpTuple__srpTupleBox.srp .srpTuple__tupleTable a', {visible: true});
    let allATags = await tab.$$('.pageComponent.srpTuple__srpTupleBox.srp .srpTuple__tupleTable a');
    let linksOfHouse = [];
    for(let i = 0 ; i < allATags.length ; i++){
        let link = await tab.evaluate(function(elem){ return elem.getAttribute('href')}, allATags[i]);
        if(link[1] >= "1" && link[1] <= "9"){
            link = "https://www.99acres.com" + link;
            linksOfHouse.push(link);
        }
    }
    for(let i = 0 ; i < linksOfHouse.length ; i++){
        await infoOfEachHouse(browser, linksOfHouse[i]);
        await tab.waitForTimeout(1000);
    }
}

async function infoOfEachHouse(browser, link){
    let newtab = await browser.newPage();
    newtab.goto(link);
    let configuration = "null";
    let area = "null";
    let facing = "null";
    let propertyAge = "null";
    let floor_number = "null";
    await newtab.waitForTimeout(3000);
    let image = await newtab.$('.slide.selected .pageComponent img');
    let imagelink = await newtab.evaluate(function(elem){ return elem.getAttribute('src')}, image);
    await newtab.waitForSelector('#FactTableComponent td>div', {visible : true});
    let allTDsDiv = await newtab.$$('#FactTableComponent td>div');
    if(allTDsDiv[1])
        area = await newtab.evaluate(function(elem){ return elem.textContent }, allTDsDiv[1]);
    if(allTDsDiv[3])
        configuration = await newtab.evaluate(function(elem){ return elem.textContent }, allTDsDiv[3]);
    let price = await newtab.evaluate(function(elem){ return elem.textContent }, allTDsDiv[5]);
    let address = await newtab.evaluate(function(elem){ return elem.textContent }, allTDsDiv[7]);
    if(allTDsDiv[9])
        floor_number = await newtab.evaluate(function(elem){ return elem.textContent }, allTDsDiv[9]);
    if(allTDsDiv[11])
        facing = await newtab.evaluate(function(elem){ return elem.textContent }, allTDsDiv[11]);
    if(allTDsDiv[15])
        propertyAge = await newtab.evaluate(function(elem){ return elem.textContent }, allTDsDiv[15]);
    price = price.substring(0,11).trim();
    // console.log(area + "---" + configuration + "---" + price + "---" + address + "---" + floor_number + "---" + facing + "---" + overlooking + "---" + propertyAge + "\n\n");
    await processDetails(link, imagelink, area, configuration, price, address, floor_number, facing, propertyAge);
    await newtab.close();
}

async function checkfile(){
    let filePath = `Property.json`;
    return fs.existsSync(filePath);
}

async function updateFile(websitelink, imagelink, area, configuration, price, address, floor_number, facing, propertyAge){
    let filePath = `Property.json`;
    let data = JSON.parse(fs.readFileSync(filePath));
    let OneHouse = {
        Price : price,
        Area : area,
        Address : address,
        Configuration : configuration,
        Floor_number : floor_number,
        Facing : facing,
        PropertyAge : propertyAge,
        ImageLink : imagelink,
        WebsiteLink : websitelink
    }
    await data.push(OneHouse);
    await fs.writeFileSync(filePath, JSON.stringify(data));
}

async function createFile(websitelink, imagelink, area, configuration, price, address, floor_number, facing, propertyAge){
    let filePath = `Property.json`;
    let data = [];
    let OneHouse = {
        Price : price,
        Area : area,
        Address : address,
        Configuration : configuration,
        Floor_number : floor_number,
        Facing : facing,
        PropertyAge : propertyAge,
        ImageLink : imagelink,
        WebsiteLink : websitelink
    }
    await data.push(OneHouse);
    data = JSON.stringify(data);
    await fs.writeFileSync(filePath,data);
}

async function processDetails(websitelink, imagelink, area, configuration, price, address, floor_number, facing, propertyAge){
    let isPropertyfile = await checkfile();
    if(isPropertyfile)    
        await updateFile(websitelink, imagelink, area, configuration, price, address, floor_number, facing, propertyAge);
    else
        await createFile(websitelink, imagelink, area, configuration, price, address, floor_number, facing, propertyAge);
}

async function wrapedSendMail(mailOptions){
    return new Promise((resolve,reject)=>{
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'tt5061437@gmail.com',
                pass: 'Test@1234'
            }
        });

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log("error is "+error);
                resolve(false); // or use rejcet(false) but then you will have to handle errors
            } 
            else {
                console.log('Email sent: ' + info.response);
                resolve(true);
            }
        });
    })
}

