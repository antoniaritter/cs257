//Authors: Antonia Ritter and Kai Johnson

function loadMenus() {
    var url = getAPIBaseURL() + '/menus/';
    fetch(url, {method: 'get'})
    .then((response) => response.json())
    .then(function(menus) {
        var html = '';
        var dropdowns = ['countries', 'crops', 'years'];
        for (var i = 0; i < 3; i++){
            var dropdown = dropdowns[i];
            var elements = menus[0][dropdown];
            html += '<div><label for="' + dropdown + '_dopdown">'
                  + 'Choose from ' + dropdown + '</label>'
                  + '<select id="' + dropdown + '_dropdown">';

            for(var j = 0; j < elements.length; j++){
                html += '<option value="' + elements[j] + '">' + elements[j] + '</option>';
            }
            html += '</select></div>';
        }
        var menuListElement = document.getElementById('menus_dropdowns');
        if (menuListElement) {
            menuListElement.innerHTML = html;
        }
    })
    .catch(function(error) {
        console.log(error);
    });
}

function onDisplayButtonPress(){
    var country = document.getElementById('countries_dropdown').value;
    var crop = document.getElementById('crops_dropdown').value;
    var year = document.getElementById('years_dropdown').value;
    
    var url = getAPIBaseURL() + '/main/blah';
    fetch(url, {method: 'get'})
    .then((response) => response.json())
    .then(function(results) {
        var html = '';
        html = '<p>yield: ' + results[0] + '</p><p>' + country + ' ' + crop + ' ' + year + '</p>';
        var menuListElement = document.getElementById('display_results');
        if (menuListElement) {
            menuListElement.innerHTML = html;
        }
    })
    .catch(function(error) {
        console.log(error);
    });
}

function getAPIBaseURL() {
    var baseURL = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/api';
    return baseURL;
}

function initialize() {
    loadMenus();
    var button = document.getElementById('display_button');
    button.onclick = onDisplayButtonPress;
}

window.onload = initialize;
