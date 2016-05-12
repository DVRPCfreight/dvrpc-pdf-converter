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
        fileCounter();

        updateConvertButton();
    }

    function fileCounter(files){
        var num = $id("file-count");
        num.innerHTML = file_num;
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

function updateInputs() {
    //celar the list of files
    var item_list = $id('input-file-list');
    // item_list.removeChild(item_list.childNodes[0]);
    var elements = item_list.getElementsByTagName('li');
    item_list.removeChild(elements[0]);
    file_num = file_num - 1;
    fileCounter();
}
function listFiles(files) {
    for (var i = 0, len = files.length; i < len; i++) {
        store_filenames.push(files[i]);
        var filestr = files[i].split('\\').pop().split('/');
        var file = filestr.splice(-1)[0];
        Files(file);
    }
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

    var status_card = $id('status-card');
    status_card.classList.remove('none');

    var process_text = $id('process-text');
    process_text.innerHTML = 'Processing file <span id="item-counter">1</span> of '+ len +'...';    

    var item_counter = $id('item-counter');
    var progress_bar = $id('status-progress-bar');
    progress_bar.style.width = "2%";


    function forloop(){
        if(i < len){
            var filestr = _files[i].split('\\').pop().split('/');
            var file = filestr.splice(-1)[0];
            var name = file.split(".")[0];

            item_counter.innerHTML = i + 1;

            //copy file and make standard name
            ft.copy(_files[i], '/tmp/convert', function (err) {
                if (err) {return;}

                pdf2png.convert( '/tmp/convert', { quality: 300 }, function(resp){
                    if(!resp.success)
                    {
                        constructResult('error', name);
                        i++; 
                        setTimeout(forloop, 0);
                        return;
                    }
                    fs.writeFile(output_location +"\\"+ name +".png", resp.data, function(err) {
                        if (err) {
                            constructResult('error', name);
                            i++; 
                            setTimeout(forloop, 0);
                        }
                        else {
                            constructResult('success', name);
                            i++; 
                            setTimeout(forloop, 0);
                            
                        }
                    });
                }); 
            });

            
        }
      }
      forloop();

    function constructResult (status, name) {
        if (status === 'success') {
            var content = '<div class="grid-item "><div class="grid-item-content"><img src="'+ output_location +'\\'+ name +'.png"/></div><div class="item-title"><svg class="success report-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 96 120" width="" height="" x="0px" y="0px"><path d="M48 4c24.256 0 44 19.74 44 44 0 24.256-19.744 44-44 44-24.26 0-44-19.744-44-44 0-24.26 19.74-44 44-44zM48 0c-26.508 0-48 21.492-48 48s21.492 48 48 48 48-21.492 48-48-21.492-48-48-48v0z"/><path d="M44.084 66.168c-0.528 0-1.036-0.208-1.416-0.584l-16.172-16.168c-0.78-0.78-0.78-2.048 0-2.828s2.048-0.78 2.828 0l14.444 14.436 22.648-34.128c0.608-0.92 1.852-1.176 2.772-0.56 0.92 0.608 1.172 1.852 0.564 2.772l-24 36.168c-0.332 0.5-0.868 0.828-1.468 0.888-0.064 0-0.132 0.004-0.2 0.004z" /></svg>'+ name +'</div></div>';
            success++;
            if(success === 1) {
                var success_card = $id('success-card');
                success_card.classList.remove('none');
            }
            success_counter.innerHTML = success;
        } else {
            var content = '<div class="grid-item"><div class="grid-item-content"><img src=""/></div><div class="item-title"><svg class="error report-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 96 120" x="0px" y="0px"><path d="M93.82 94.956c-0.028-0.004-0.056-0.004-0.080 0h-91.564c-0.696 0-1.34-0.364-1.704-0.952-0.364-0.584-0.392-1.332-0.080-1.948l45.78-90c0.684-1.344 2.888-1.344 3.572 0l45.556 89.564c0.324 0.36 0.52 0.828 0.52 1.352 0 1.092-0.9 1.984-2 1.984zM5.436 90.956h85.040l-42.52-83.584-42.52 83.584z" /><path d="M51.884 70.956h-8.072c-2.144 0-2.612-2.6-2.612-3.608l-1.476-27.208c-0.028-0.528 0.164-1.048 0.524-1.432s0.868-0.604 1.4-0.608l12.26-0.084c0.536-0.004 1.044 0.212 1.416 0.596 0.368 0.384 0.564 0.904 0.536 1.436l-1.368 27.9c0.004 1.152-0.824 3.008-2.608 3.008zM45.18 66.956h5.368l1.284-24.956h-7.996l1.344 24.956z"/><path d="M53.564 86.956h-10.768c-1.44 0-2.612-1.176-2.612-2.608v-6.776c0-1.428 1.172-2.6 2.612-2.6h10.768c1.436 0 2.608 1.172 2.608 2.6v6.776c0 1.432-1.172 2.608-2.608 2.608zM44.172 82.956h8v-4h-8v4z"/></svg>'+ name +'</div></div>';
            errors++;
            if(errors === 1) {
                var error_card = $id('error-card');
                error_card.classList.remove('none');
            }
            error_counter.innerHTML = errors;
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

        if((i + 1) === len) {
            progress_bar.classList.remove('active');
            progress_bar.classList.remove('progress-bar-striped');
            progress_bar.classList.add('progress-bar-success');
            progress_bar.style.width = '100%';
            process_text.innerHTML = '<b>Conversion complete!</b>'
        } else {
            progress_bar.style.width = ((i+1)/(len))*100 + '%';
        }

        updateInputs();
        updateConvertButton();
    }
}

function updateConvertButton(e) {
    if(file_num > 0 && output_location !== '') {
        var b = $id('process-btn');
        b.classList.remove('btn-default');
        b.classList.remove('disabled');
        b.classList.add('btn-success');
        b.innerHTML = 'Start file conversion!';
    } else if (file_num === 0){
        var b = $id('process-btn');
        b.classList.remove('btn-success');
        b.classList.add('disabled');
        b.classList.add('btn-default');
        b.innerHTML = 'Conversion processed';
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
    process_btn.classList.add('disabled');
    process_btn.innerHTML = 'Conversion in progress...'
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