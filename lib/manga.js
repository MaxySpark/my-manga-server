var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var readlineSync = require('readline-sync');

var i,c=0;
var images = [], volumes= [], main_list = [];

var nextUrl;
var dirName,dirName2;
var manga;

console.log("This Script Is Written By MaxySpark\n");

// var urlMain = "http://mangafox.me/manga/"+"tower of god".toLowerCase().trim().replace(/ /g, "_")+"/";

// var chap;
// var urlMain;
function getManga(mangaParam,chap,chap_to,callback) {
        urlMain = "http://mangafox.me/manga/"+mangaParam.toLowerCase().trim().replace(/ /g, "_")+"/";
        manga = mangaParam.toLowerCase().trim()
        request({
            url: urlMain
        },(err, res, body) => {
            if(err) throw err;
            
            else {
                var $ = cheerio.load(body);
                var vn = 0;
                var volume_data = [],titles = [];
                var tn = 0;
                $("#title > h1").each(function(){
                    dirName = $(this).html();
                    dirName = dirName.replace(' Manga','');
                })
                $(".volume").each(function() {
                    var volume = $(this).html();
                    volume = volume.replace(/<.*>/,"").replace("Volume ","v");
                    volumes.push(volume);
                });
                
                $(".title").each(function(){
                    var title = $(this).html();
                    titles.push(title);
                });
                c = $("a.tips").length;
                console.log(c);
                $('.chlist').each(function() {
                    var  chapters = [];
                    $(this).find("a.tips").each(function () {
                        var chapterName =  $(this).html();
                        console.log(chapterName);
                        
                        chapterN = chapterName.toLowerCase();
                        chapterN = chapterN.replace(manga+' ',"");
                        chapterN = parseInt(chapterN);
                        if(chapterN<10) {
                            chapterN="c00"+chapterN;
                        }
                        else if(chapterN>10 && chapterN<100 ){
                            chapterN = "c0"+chapterN;
                        }
                        else if(chapterN>100 && chapterN<1000) {
                            chapterN = "c"+chapterN;
                        }
                        var data = {
                            id : c--,
                            url : $(this).attr('href'),
                            volume_name: volumes[vn],
                            chapter : chapterN,
                            chapter_name : chapterName,
                            chapter_title : titles[tn]
                        };
                        tn++;
                        chapters.push(data);   
                        main_list.push(data);
                        // console.log(main_list);
                    });

                    chapters.reverse();
                    
                    var chapter_list = {
                        
                        ch_length : $(this).find('.tips').length,
                        ch_data : chapters
                    }
                    volume_data.push(chapter_list);
                    vn++;
                });
                
                volumes.reverse();
                volume_data.reverse();
                main_list.reverse();

                main_list.forEach(function(element) {
                    console.log('['+element.id+'] \t'+element.chapter_name);
                });
                
                if(!chap) {
                    console.log('\nDownload Options - ');
                    var options = ['Download Single Chapter','Download Chapter In Range! '];
                    var index = readlineSync.keyInSelect(options, 'Select Options');
                } else {
                    
                    if(chap_to) {
                        var index = 1;
                    } else {
                        var index = 0;
                    }
                }
                if(index+1==1) {
                    if(!chap) { 
                        var serialNumber = readlineSync.question('\nEnter The Serial Number Of The Chapter You Want To Download : ');
                        chap = parseInt(serialNumber);
                    }
                    
                    if(chap < 1 || chap > main_list.length) {
                        console.log('Entered Serial Number Is Not Exist Please Check The Entered Serial Number and try Again');
                    } else {
                        download(main_list[(chap-1)]);
                    }
                    
                } else if(index+1==2) {
                    console.log('\nFirst Enter The Serial Number Of The Chapter From Which You Want To Start Download Then Enter The Serial Number To Which You Want To Download');
                    var chap_beg = readlineSync.question('\nEnter The Serial Number Of The Chapter From Which You Want To Start Download : ');
                    chap = parseInt(chap_beg);
                    var chap_end = readlineSync.question('\nEnter The Serial Number Of The Chapter To Which You Want To Download : ');
                    chap_to = parseInt(chap_end);
                    
                    if(chap < 1 || chap > main_list.length || chap_to > main_list.length) {
                        console.log('Entered Serial Number Is Not Exist Please Check The Entered Serial Number and try Again');
                    } else {
                        download(main_list[(chap-1)]);
                    }
                    
                }   
            }
        });
        callback();
}


function download(mangaObj) {
    var a=0,b=0;
    var Volume = mangaObj.volume_name;
    var Chapter = mangaObj.chapter;
    var Title = mangaObj.chapter_title;
    Title = Title.replace(/\<|\>|\:|\"|\/|\\|\||\?|\*/g,'');
    if(Title.length >70) {
        Title = 'Chapter '+mangaObj.id;
    }
    dirName2 = './files/'+dirName;
    var dir = "./files/"+dirName+'/'+mangaObj.chapter_name; 
    var downloadDir = "./files/"+dirName+'/'+mangaObj.chapter_name;
    var Furl = mangaObj.url;
    var page = 0;
    console.log('\nNow Downloading : '+mangaObj.chapter_name+'\n');

    readNextRequest(Furl);    
    
    function readNextRequest(url) {
        request({
            url: url,
            gzip: true,
            // json: true
        },
        (err,res,body) => {
            if(err) throw err;
            else {
                var $ = cheerio.load(body);
                // console.log(++b);
                page = ($(".l > select > option").length / 2) - 1;
                $(".read_img > a > img").each(function() {
                    var img_link = $(this).attr('src');
                    images.push(img_link);
                    if (!fs.existsSync('./files/')){
                        fs.mkdirSync('./files/');
                    }
                    if (!fs.existsSync(dirName2)){
                        fs.mkdirSync(dirName2);
                    }
                    if (!fs.existsSync(dir)){
                        fs.mkdirSync(dir);
                    }
                    request(img_link).pipe(fs.createWriteStream(downloadDir+'/'+((a++)+1)+'.jpg')).on('finish', function() {         
                        console.log(mangaObj.chapter_name+" : Downloading - "+(++b)+' of '+page);
                        if(b==page) {
                            console.log('\nDownloading Completed : '+mangaObj.chapter_name);
                            if(chap && chap_to) {
                                chap++;
                                if(chap<(chap_to+1)) {
                                    download(main_list[chap-1]);
                                } else {
                                    console.log('\nDownload Directory : '+__dirname+'\\downloads\\');
                                }
                            } else {
                                console.log('\nDownload Directory : '+__dirname+'\\downloads\\');
                            }
                                                   
                        }
                        });
                });
                $(".read_img > a").each(function() {
                    nextUrl = $(this).attr('href');
                    // console.log(nextUrl);
                });           
                if(nextUrl != "javascript:void(0);") {
                    nextUrl = urlMain + Volume +'/'+Chapter+'/'+nextUrl;
                    // console.log(nextUrl);
                    readNextRequest(nextUrl);
                } else {
                    // downloadLoop(images);
                }
                
            }
        });
    }

}

module.exports = getManga;