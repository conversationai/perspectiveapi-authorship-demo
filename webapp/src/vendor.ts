/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
// Angular 2
import '@angular/platform-browser';
import '@angular/platform-browser-dynamic';
import '@angular/core';
import '@angular/common';
import '@angular/http';
import '@angular/router';

// RxJS
import 'rxjs';

// Other vendors for example jQuery, Lodash or Bootstrap
// You can import js, ts, css, sass, ...

// TODO: importing of remotely controlled scripts is not allowed. We should be
// serving with a local copy. Ideally included appropriately into the bundle
// and not loaded like this.
//
// Imports gsap
// let script = document.createElement("script");
// script.type = "text/javascript";
// script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/TweenMax.min.js";
// document.body.appendChild(script);

require('gsap');

// // Imports gapi
// let script2 = document.createElement("script");
// script2.type = "text/javascript";
// script2.src = "https://apis.google.com/js/api.js";
// document.body.appendChild(script2);
