'use strict';

var pdf2png = require('pdf2png');
var fs = require('fs');
var util = require('util');
var ft = require('fs-extra');
var ms = require('masonry-layout');
var imload = require('imagesloaded');

var store_filenames = [];
var output_location = '';
var file_num = 0;


var grid = document.querySelector('.grid');


// getElementById
    function $id(id) {
        return document.getElementById(id);
    }


    // output information
    function Output(msg) {
        var m = $id("messages");
        m.innerHTML = msg + m.innerHTML;
    }

    function Files(msg) {
        var l = $id("input-file-list");
        l.innerHTML = l.innerHTML + '<li>'+ msg +'</li>';

        //update count
        file_num++;
        var num = $id("file-count");
        num.innerHTML = file_num;

        updateConvertButton();
    }


    // file drag hover
    function FileDragHover(e) {
        e.stopPropagation();
        e.preventDefault();
        e.target.className = (e.type == "dragover" ? "hover" : "");
    }


    // file selection
    function FileSelectHandler(e) {

        // cancel event and hover styling
        FileDragHover(e);

        // fetch FileList object
        var files = e.target.files || e.dataTransfer.files;

        // process all File objects
        for (var i = 0, f; f = files[i]; i++) {
            if(f.type === 'application/pdf'){
                ParseFile(f);   
            }
            
        }

    }


    // output file information
    function ParseFile(file) {
        store_filenames.push(file.path);

        Files(file.name);

    }


    // initialize
    function Init() {

        var filedrag = $id("filedrag");

        // is XHR2 available?
        var xhr = new XMLHttpRequest();
        if (xhr.upload) {

            // file drop
            filedrag.addEventListener("dragover", FileDragHover, false);
            filedrag.addEventListener("dragleave", FileDragHover, false);
            filedrag.addEventListener("drop", FileSelectHandler, false);
            filedrag.style.display = "block";

        }

    }

    // call initialization file
    if (window.File && window.FileList && window.FileReader) {
        Init();
    }


function listFiles(files) {
    for (var i = 0, len = files.length; i < len; i++) {
        store_filenames.push(files[i]);
        var filestr = files[i].split('\\').pop().split('/');
        var file = filestr.splice(-1)[0];
        Files(file);
    }
}

function constructResult (status, name) {
    if (status === 'success') {
        var content = '<div class="grid-item "><div class="grid-item-content"><img src="'+ output_location +'\\'+ name +'.png"/></div><div class="item-title">Report: '+ name +'</div></div>';
    } else {
        var content = '<div class="grid-item"><div class="grid-item-content"><img src=""/></div><div class="item-title">Report: '+ name +'</div></div>';
    }
    var wrapper= document.createElement('div');
    
    wrapper.innerHTML= content;

    grid.insertBefore(wrapper, grid.firstChild);
    
    wrapper.style.display = "none";

    imload(  grid, function() {
        wrapper.style.display = "block";
        // layout Masonry after each image loads
        msnry.prepended( wrapper );
        msnry.layout();
    });
}


var success_counter = $id('complete-convert');
var error_counter = $id('error-convert');

function processFiles(){

    var _files = store_filenames;
    //pdf to png
    var i = 0;
    var len = _files.length;
    var success = 0;
    var errors = 0;


    function forloop(){
        if(i < len){
            var filestr = _files[i].split('\\').pop().split('/');
            var file = filestr.splice(-1)[0];
            var name = file.split(".")[0];

            Output('Start processing report #'+name +'<br/>');

            //copy file and make standard name
            ft.copy(_files[i], '/tmp/convert', function (err) {
                if (err) return console.error(err);

                // try {
                    pdf2png.convert( '/tmp/convert', { quality: 300 }, function(resp){
                        if(!resp.success)
                        {
                            
                            Output('Report #'+ name +' conversion failed.<br/>Error message:'+ resp.error +'<br/>')
                            i++; 
                            setTimeout(forloop, 0);
                            
                            return;
                        }
                        fs.writeFile(output_location +"\\"+ name +".png", resp.data, function(err) {
                            if (err) {
                                constructResult('error', name);
                                
                                Output('Error in png conversion '+ err +'<br/>');
                                i++; 
                                setTimeout(forloop, 0);
                            }
                            else {
                                constructResult('success', name);

                                success++;
                                success_counter.innerHTML(success)
                                
                                Output('Report #'+ name +' cover converted.<br/>');
                                i++; 
                                setTimeout(forloop, 0);
                            }
                        });
                    }); 
                // }
                // catch (e) {
                //     Output('Report #'+ name +' conversion failed.<br/>')
                //     i++; 
                //     setTimeout(forloop, 0);
                // }
            });

            
        }
      }
      forloop();
}

function updateConvertButton(e) {
    if(file_num > 0 && output_location !== '') {
        var b = $id('process-btn');
        b.classList.remove('btn-default');
        b.classList.remove('disabled');
        b.classList.add('btn-success');
        b.innerHTML = 'Start file conversion!'
    }

}


var ipc = require('ipc');
var remote = require('remote'); 
var dialog = remote.require('dialog');
// var BrowserWindow = remote.require('browser-window');

// var closeEl = document.querySelector('.close');
// closeEl.addEventListener('click', function () {
//     ipc.send('close-main-window');
// });


var dia_btn = document.querySelector('.dialog-browser');
dia_btn.addEventListener('click', function () {
    dialog.showOpenDialog({ properties: [ 'openFile', 'multiSelections' ], filters: [
    { name: 'PDF', extensions: ['pdf', 'PDF'] }]},
        function (fileNames){
            if(typeof fileNames !== undefined){
                //store the files for later
                listFiles(fileNames);
            }
        });
});

var output_btn = document.querySelector('#output-dialog');
output_btn.addEventListener('click', function () {
    dialog.showOpenDialog({ properties: [ 'openDirectory' ]},
        function (directory){

            if(typeof directory !== undefined){
                //store the files for later
                output_location = directory;

                var out_field = document.querySelector('#output-location');
                out_field.value = directory;
                updateConvertButton();
            }            
        });
});

var process_btn = document.querySelector('#process-btn');
process_btn.addEventListener('click', function () {
     processFiles();
});

// masonry shit

var msnry = new ms( grid, {
    itemSelector: '.grid-item', 
    columnWidth: '.grid-sizer',
    percentPosition: true
    // columnWidth: 200
});


// document.getElementById("min-btn").addEventListener("click", function (e) {
//    var window = BrowserWindow.getFocusedWindow();
//    window.minimize(); 
// });

// document.getElementById("max-btn").addEventListener("click", function (e) {
//    var window = BrowserWindow.getFocusedWindow(); 
//    window.maximize(); 
// });

// document.getElementById("close-btn").addEventListener("click", function (e) {
//    var window = BrowserWindow.getFocusedWindow();
//    window.close();
// }); 