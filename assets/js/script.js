$(document).ready(function() {
    var apiKey = "de59edcad53b52bdb1763734853a531f"; 
    var cityName = JSON.parse(localStorage.getItem("cityNameList")) || [];
    var currentObj, forecastObj = {};
    var hrInterval; 

    $("#details").removeClass("hidden");
    $("#loader").addClass("hidden");


    /*** Functions to control the display of weather data ***/
    function showAll() {
        $(".current").show();
        $(".forecast").show();
    }

    function hideAll() {
        $(".current").hide();
        $(".forecast").hide();
    } 

    /*** Building the elements for the history ***/
    function cityHistory() {
        $(".search-history").empty(); // To avoid repeated elements 
        // Looping through the array of cities
        for (var i = 0; i < cityName.length; i++) {
            var a = $("<div>");
            var name = $("<span>");
            // Adding a class, attribute and text
            a.addClass("city d-block border p-2 text-truncate");
            a.attr("data-name", cityName[i]);
            name.addClass("city-text")
            name.text(cityName[i]);
            a.append(name)
            // Adding the new element to the HTML
            $(".search-history").append(a);
        }
    }

    /*** Calling current weather API and getting the information ***/
    function getQueryURL(city) {
        var queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`; 
   
        $(".current").empty(); // Empty previous weather
        // Getting the current weather from API
        $.ajax({
            url: queryURL,
            method: "GET"
        }).then(function(response){
           currentObj = response;             
           displayCurrent();
           displayUV();        
        });      
    }

    /*** Calling 5-day API and getting the information ***/
    function getQueryURL5(city) {
        var queryURL5 = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${apiKey}`;
        
        $("#5-day").empty(); // Empty previous previsions
        
        // Getting the forecast weather from API
        $.ajax({
            url: queryURL5,
            method: "GET"
        }).then(function(response){
            forecastObj = response; 
            hrInterval = 0;
            // Building the 5-day cards           
            for (let i = 1; i < 6; i++) {           
                displayForecast(i);
            }       
        });
    }

    /*** Populate current weather ***/
    function displayCurrent(){
        var currentDate = moment().format("L");                
        // Create main element
        $(".current").append(` <div class="card-body">
        <h3 id="current-city"></h3>
        <p class="text">Temperature: <span id="current-temp"></span>&#176F</p>
        <p>Humidity: <span id="current-humi"></span>%</p>
        <p>Wind Speed: <span id="current-wind"></span>MPH</p>
        <p>UV Index: <span class="text-white py-1 px-2" id="current-uv"></span></p>
        </div>`)  
        $("#current-city").text(`${currentObj.name} (${currentDate}) `);
        $("#current-city").append($(`<img src= "http://openweathermap.org/img/wn/${currentObj.weather[0].icon}@2x.png" 
            alt="${currentObj.weather[0].description}"/>` ));           
        $("#current-temp").text(currentObj.main.temp);
        $("#current-humi").text(currentObj.main.humidity);
        $("#current-wind").text(currentObj.wind.speed);
    }
    
    /*** Populate UX data and color background ***/
    function displayUV(){
        var queryURLuv = `https://api.openweathermap.org/data/2.5/uvi?lat=${currentObj.coord.lat}&lon=${currentObj.coord.lon}&appid=${apiKey}`;
        var uvIndex;
        // Getting the UV index from API
        $.ajax({
            url: queryURLuv,
            method: "GET"
        }).then(function(response){
            uvIndex = response.value
            $("#current-uv").text(uvIndex);
            // Change the color based on uvIndex severity
            // above 3 but less than 6, the UV level is considered as moderate. Anything below is favorable and above is severe
            if (uvIndex < 3) {
                $("#current-uv").removeClass("btn-warning bg-danger").addClass("btn-success");
            } else if (uvIndex > 6) {
                $("#current-uv").removeClass("btn-success btn-warning").addClass("bg-danger");
            } else $("#current-uv").removeClass("btn-success bg-danger").addClass("btn-warning");
        });    
    }

    /*** Populate 5-day weather ***/
    function displayForecast(nb){
        var date = moment().add(nb, 'day').format("L");     // get the date for each day                            
        // Create main element  
        $("#5-day").append(`<div class="card bg-primary text-white col-sm-2 mx-2 px-1">
        <div class="card-body px-0">
            <h6 class="card-title" index="${nb}"></h6>
            <p class="icon text-center" index="${nb}"></p>
            <p class="card-text">Temp: <span class="temp" index="${nb}"></span>&#176F</p>
            <p class="card-text">Humidity: <span class="humi" index="${nb}"></span>%</p>
        </div>`);
         
        hrInterval = (nb - 1) * 8 + 3;  // Set interval for the list array to get temp at noon
        
        // Adding data to forecast elements
        if (hrInterval < forecastObj.list.length) {     // Safe code to limit to array length
            var iconcode = forecastObj.list[hrInterval]
            $(`.card-title:eq(${nb-1})`).text(date);       
            $(`.icon:eq(${nb-1})`).append($(`<img src= "http://openweathermap.org/img/wn/${iconcode.weather[0].icon}.png" 
                alt="${iconcode.weather[0].description}" style="height: 60px; width: 60px"/>`));           
            $(`.temp:eq(${nb-1})`).text(forecastObj.list[0].main.temp);
            $(`.humi:eq(${nb-1})`).text(forecastObj.list[0].main.humidity);
        } 
    }

   // Clearing previously search cities 
    $("#clear").on("click", function(event) {
        event.preventDefault();
        cityName = [];
        localStorage.clear();
        /* Disable btn once used */
        $(this).disabled = "true";
        $(".search-history").empty()
    });
        

    if (typeof cityName !== 'undefined' && cityName.length > 0) {
        cityHistory();
        getQueryURL(cityName[cityName.length-1]);
        getQueryURL5(cityName[cityName.length-1]); 
        showAll();
    } else hideAll();
       
    // Storing searched item
    $("#search-city").on("click", function(event) {
        event.preventDefault();
        let city = $("input").val().trim();
        let checkCode = 0;
        
        //Check for spelling and return error modal if bad
        var queryURL5 = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${apiKey}`;
        $.ajax({
            url: queryURL5,
            method: "GET"
        }).then(function(response){
            checkCode = response.cod; 
            console.log(checkCode);         
        });
        if (city !== "" || checkCode === 200) {   // TO DO: Add a Stop duplicate entries
            cityName.push(city);
            localStorage.setItem('cityNameList', JSON.stringify(cityName));
            getQueryURL(city);
            getQueryURL5(city); 
            showAll();
            // calling function to build element for each city
            cityHistory();
            $("input").val("")
        } else { $('#error-modal').modal("toggle");  }                                              
    });


 // when clicking on a city in the history
    $(document).on("click", ".city", function(event) {
        event.preventDefault();
        let city = $(this).data('name');        
        console.log(city)                   //FOR TESTING
        getQueryURL(city);
        getQueryURL5(city);                      
        showAll();
    });
})

