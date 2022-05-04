  'use strict';

  function gotKey (event) {
      
      var key = event.key;

      if (key =="p"){
          followEarth = true;
      } else {
          followEarth = false;
      }

      if (key == "m") {
          followMoon = true;
      } else {
          followMoon = false;
      }
  }
  
