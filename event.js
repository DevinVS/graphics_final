  'use strict';

  function gotKey (event) {
      
      var key = event.key;

      if (key =="p"){
          followEarth = true;
          followMoon = false;
      }

      if (key == "c"){
          followEarth = false;
          followMoon = false;
      }

      if (key == "m") {
          followMoon = true;
          followEarth = false;
      }

      if (key == "-"){
          interval /= 2;
      }

      if (key == "+"){
          interval *= 2;
      }
  }
