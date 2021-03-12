//Authors: Antonia Ritter and Kai Johnson
//CS257
//Feb-March 2021

window.onload = initialize;

/*A randomized first display is shown and the user can select and modify the display with a button press*/
function initialize() {
  buildStartingPage();
  var button = document.getElementById('display-button');
  button.onclick = onDisplayButtonPress;//onDisplayButtonPress;
}

/**
 * NOTE:
 * functions buildStartingPage(), displayMap(), and displayGraph()
 * draw upon suplementary methods described in
 * startingpage.js, map.js, and graph.js respectively
 */

/**
 * builds the starting homescreen page:
 * calls for the dropdowns to be populated,
 * calls for a random selection of dropdown values
 * calls for the display of the random selection of dropdown values
 */
function buildStartingPage(){
  var url = getAPIBaseURL() + '/menus/';
  fetch(url, {method: 'get'})
  .then((response) => response.json())
  .then(function(countriesCropsYears) {
    buildMenus(countriesCropsYears);

    var randomCountryCropYear = chooseRandomCountryCropYear(countriesCropsYears);
    menuSelectRandomCountryCropYear(randomCountryCropYear);

    var country = randomCountryCropYear["countries"];
    var crop = randomCountryCropYear["crops"];
    var year = randomCountryCropYear["years"];
    display(country, crop, year);
  })
  .catch(function(error) {
    console.log(error);
  });
}

/**
 * If the 'display' button is pressed,
 * any pre-existing display content is removed,
 * the dropdown menu selections are read,
 * and the information selected by dropdowns is displayed.
 */
function onDisplayButtonPress(){
  wipeScreenClean();

  var country = document.getElementById('countries-dropdown').value;
  var crop = document.getElementById('crops-dropdown').value;
  var year = document.getElementById('years-dropdown').value;

  display(country, crop, year);
}

/*All display type containers are set to empty.*/
function wipeScreenClean(){
  document.getElementById('display-map').innerHTML = '';
  document.getElementById('display-graph').innerHTML = '';
  document.getElementById('display-table').innerHTML = '';
  document.getElementById('display-single').innerHTML = '';
}

/**
 * returns the url for the desired data
 * @param  {string} country     the 'countries' dropdown selection
 * @param  {string} crop        the 'crops' dropdown selection
 * @param  {string} year        the 'years' dropdown selection
 * @return {string}             the url
 */
function getURL(country, crop, year){
  var url = getAPIBaseURL();

  if (country === 'All countries') {
    url += '/mapped_production/' + crop + '/' + year;
  }
  else if (year === 'All years') {
    url += '/graphed_production/' + country + '/' + crop;
  }
  else if (crop === 'All crops') {
    url += '/tabled_production/' + country + '/' + year;
  }
  else {
    url += '/single_production/' + country + '/' + crop + '/' + year;
  }
  return url;
}

/**
 * returns basic api url
 * @return {string} the basic api url
 */
function getAPIBaseURL() {
  var baseURL = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/api';
  return baseURL;
}

/**
 * gets the appropriate url for the passed parameters,
 * retrieves the results from the API,
 * then passes them to the appropriate display method
 * @param  {string} country the 'countries' dropdown selection
 * @param  {string} crop    the 'crops' dropdown selection
 * @param  {string} year    the 'years' dropdown selection
 */
function display(country, crop, year){
  var url = getURL(country, crop, year);

  fetch(url, {method: 'get'})
  .then((response) => response.json())
  .then(function(results) {
    if (country === 'All countries') { displayMap(results); }
    else if (year === 'All years') { displayGraph(results); }
    else if (crop === 'All crops') { displayTable(results); }
    else { displaySingle(results); }
  })
  .catch(function(error) {
      console.log(error);
  });
}

/**
 * displays a world map with each country shaded acording to the amount of production
 * @param  {dictionary} results key as the abbreviation and
                                value as the production and name of each country
                                eg {'USA': 'production': 8000, 'country_name', 'United States of America', ...}
  */
function displayMap(results){
  var mapElement = document.getElementById('display-map');
  if (mapElement) {
    // map gets inserted here so that styling doesn't mess up other displays
    mapElement.innerHTML = '<div id="display-map-container"></div><br>'
                          + '<div id="legend-map"></div>';
  }

  var colors = ['#ffffcc', '#ffff99','#d2ff4d', '#bfff00', '#99ff99', '#00e600', '#00cc00', '#009900', '#006600', '#003300'];
  //low production color -> high production color

  var highestProduction = getHighestProduction(results);
  var productionColorKey = createProductionColorKey(highestProduction, colors);
  var colorizedResults = assignColorsToCountries(results, productionColorKey);

  initializeMap(colorizedResults);
  displayLegend(productionColorKey);

  var sortedResults = sortMapResults(results);
  var tableHTML = makeMapTable(sortedResults);
  var tableElement = document.getElementById('display-table');
  if (tableElement) {
    tableElement.innerHTML = tableHTML;
  }
}

/**
 * displays a line graph with each line representing a crop over time,
 * x-axis and time (in years) and y-axis as production (in tonnes)
 * @param  {dictionary} results key as crop
                                value as a dictionary with keys year and values production
                                eg {'Maize': {1961: 7000, 1962: 1000, ...} ...},
 */
function displayGraph(results){
  // takes results in format {crop: [year: production, year: production], crop...}
  var sortedResults = sortGraphResults(results);
  initializeGraph(sortedResults, results);
}

/**
 * displays a table of crops and their productions, sorted by production (descending)
 * @param  {list} results 2D list of crop-production pairs, sorted by production (descending)
                          eg [['Maize', 201000], ...]
 */
function displayTable(results){
  buildChart(results); 
  var html = '<h4>Crop Production</h4><table>'
            + '<thead><tr><th scope="col">Crop</th>'
            + '<th scope="col">Production (tons)</th>'
            + '</tr></thead><tbody>';

  //add rows
  for (var i = 0; i < results.length; i++){
    var crop = results[i][0];
    var production = results[i][1];
    html += '<tr><th scope="row">' + crop + '</th><td>' + production.toLocaleString() + '</td>';
  }

  // finish table
  html += '</tbody></table>';

  // insert into html page
  var element = document.getElementById('display-table');
  if (element) {
    element.innerHTML = html;
  }
}

function buildChart(results){
    // insert graph canvas
    var element = document.getElementById('display-graph');
    if (element) {
      // chartjs graph gets inserted here
      element.innerHTML = '<canvas id="crop-chart"></canvas>';
    }

    var colors = ['red', '#FF6D00', 'orange', 'yellowgreen', '#2DD311', 'darkgreen', 'blue', '#8700FF', 'purple', '#F7BFB4'];

    // number of crops to display 
    var maxCrops = 10; 

    var productionData = []
    var cropLabels = [] 
    for (var i = 0; i < maxCrops; i++){
      var crop = results[i][0];
      var production = results[i][1]; 
      cropLabels.push(crop); 
      productionData.push(production);
    }

    var ctx = document.getElementById('crop-chart').getContext('2d');
    var myChart = new Chart(ctx, {
    type: 'horizontalBar',
    data: {
        labels: cropLabels,
        datasets: [{
            data: productionData,
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 1
        }]
    },
    options: {
      scales: {
        xAxes: [{
          display: true,
          scaleLabel: {display: true, labelString: 'Production (tons)'},
          ticks: {
            beginAtZero: true
          }
        }],
        yAxes: [{
          display: true,
          scaleLabel: {display: true, labelString: 'Crop'}
        }]
      },
      legend: {
        display: false, 
        position: 'right'
      }
    }
  });
}

/**
 * displays the tonnes produced or a message if none was produced
 * @param  {int} results an integer description of how much was produced
 */
function displaySingle(results){
  var html = '';
  if (results > 0){
    html = '<p> This hyper-specific request found: ' + results + ' tons.</p>';
  }
  else{
    html = '<p>Looks like no production was reported!</p>';
  }
  var menuListElement = document.getElementById('display-single');
  if (menuListElement) {
    menuListElement.innerHTML = html;
  }
}
