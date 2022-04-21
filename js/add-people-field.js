(function ($, Drupal, drupalSettings) {
  var converted_json;

  Drupal.behaviors.webdirAddPeopleField = {
    attach: function (context, settings) {
      // Check if there are directory type fields.
      if ($(context).find('.asurite-add-people').length) {
        $('.asurite-add-people').each(function(index) {
          // Convert and check the default values.
          initialize_tree();
          
          let search_timeout = null;
          $(".field--name-field-people-search input").keyup(function() {
              var value = this.value;
              if (value.length >= 2) {
                clearTimeout(search_timeout);
                search_timeout = setTimeout(function () {
                  // Populate the tree
                  searchPeople(value);
                }, 500);
              }
              else {
                // Empty the results.
              }
          });
          
          // On node click, get all departments and update the tree.
          $("#asurite-add-people-options").on("select_node.jstree", function (e, data) {
            var existing = $(this).jstree(true).settings.core.data;
            if (!data.node.id.includes(":")) {
              getAffiliations(data.node, existing);
            }
          });
        });
      }
    }
  };


// Convert the json from the asuriteid to be compatible with the jstree.
function convert_to_tree(data, expanded) {
  var result = [];
  $(data).each(function (i, element) {
    if (element.hasOwnProperty("deptids")){
      var new_element = {};
      new_element.id = element.asurite_id.raw;
      new_element.sort = element.last_name.raw;
      new_element.text = element.display_name.raw + ', ' + element.asurite_id.raw;
      new_element.type = "person";

      result.push(new_element);
    }
  });
  result.sort(function(a, b){
    return (a["sort"] < b["sort"]) ? -1 : (a["sort"] > b["sort"]) ? 1 : 0;
  });
  
  return result;
}


// Create the asurite id checkboxes.
function initialize_tree() {
  $('#asurite-add-people-options') // listen for event
    .jstree({
      'core' : {
        'data' : [],
        'themes' : { dots: false },
        'check_callback' : true,
      },
      types: {
        "person": {
          "icon" : "fa fa-user"
        },
        "dept": {
          "icon" : "fa fa-bookmark"
        },
        "default" : {
        }
      },
      "plugins" : [ "types" ]
    });
}

function searchPeople(queryString) {
  var query = "?query=" + queryString + "&size=20";
  $.getJSON("/search-staff" + query, function(json) {
    // Get existing data.
    converted_json = convert_to_tree(json.results);
    update_tree(converted_json);
  });
}

function createChildren(node, existing, json) {
  // Create the children.
  var children = [];
  Object.keys(json).forEach(deptID => {
    
    var new_element = {};
    new_element.id = node.id + ":" + deptID;
    new_element.text = json[deptID].dept_name + ', ' + json[deptID].name;
    new_element.type = "dept";

    children.push(new_element);
  });
  
  // Add the children.
  var results = [];
  for (const treeNode of existing) {
    if (treeNode.id === node.id) {
      treeNode.children = children;
      treeNode.state = {'opened' : true, 'selected' : false};
    }
    results.push(treeNode);
  }
  
  return results;
}
/*
 * Get all affiliations for an asurite.
 */
function getAffiliations(node, existing) {
  var query = "?asurite_id=" + node.id + "&size=20";
  $.getJSON("/profile-affiliations" + query, function(json) {
    if (Array.isArray(json) && !json.length) {
      // Empty data.
      return;
    }

    converted_json = createChildren(node, existing, json);

    if (node.children.length == 0) {
      $('#asurite-add-people-options').jstree(true).settings.core.data = converted_json;
      $('#asurite-add-people-options').jstree(true).refresh();
    }
  });
}

// Create the asurite id checkboxes.
function expand_tree(json) {
  // Get existing data.
  $('#asurite-add-people-options').jstree(true).settings.core.data = json;
  $('#asurite-add-people-options').jstree(true).refresh();
}

// Create the asurite id checkboxes.
function update_tree(json) {
  // Get existing data.
  $('#asurite-add-people-options').jstree(true).settings.core.data = json;
  $('#asurite-add-people-options').jstree(true).refresh();
}

})(jQuery, Drupal, drupalSettings);