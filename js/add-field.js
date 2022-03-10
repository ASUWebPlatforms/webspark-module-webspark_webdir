(function ($, Drupal, drupalSettings) {
  var converted_json;

  Drupal.behaviors.webdirAddField = {
    attach: function (context, settings) {
      // Check if there are directory type fields.
      if ($(context).find('.asurite-add').length) {
        $('.asurite-add').each(function(index) {
          // Convert and check the default values.
          initialize_tree();
          $(".directory-tree").on('change', function() {
            // Update the tree.
            update_tree();
          });
          
          // Add people form Asurie Add field.
          $("#asurite-add-options").on("select_node.jstree", function (e, data) {
            // Get the existing values
            default_values = $('.asurite-tree').val().split(',');
            // Add the person to the tree.
            default_values.push(data.node.id);
            // Recreate tree with the default values.
            update_tree(default_values);
          });
          
          // Refresh when a person was removed from the list.
          $("#asurite-tree-options").on("select_node.jstree", function (e, data) {
            // Update the tree.
            update_tree();
          });
        });
      }
    }
  };

// Convert the json from the asuriteid to be compatible with the jstree.
function convert_asurite_to_tree(data, departments, existing_values) {
  var result = [];
  var temp = {};
  $(data).each(function (i, element) {
    $(element.deptids.raw).each(function (j, deptid) {
      var new_element = {};
      if (departments.includes(deptid) && 
          !existing_values.includes(element.asurite_id.raw + ':' + deptid)) {
        
        var department_data = getDepartmentData(element, deptid);
        
        new_element.id = element.asurite_id.raw + ':' + deptid;
        // Remove maybe.
        new_element.sort = element.last_name.raw;
        new_element.text = element.display_name.raw + ', ' + element.asurite_id.raw +
                ', ' + department_data['name']+ ', ' + department_data['title'];
        new_element.type = "person";
        if (!temp.hasOwnProperty(deptid)) {
          temp[deptid] = [];
        }
        temp[deptid].push(new_element);
      }
    });
  });
  // Collapse and sort the temp into result.
  Object.keys(temp).forEach(deptID => {
    var sorted = temp[deptID];
    sorted.sort(function(a, b){
      return (a["sort"] < b["sort"]) ? -1 : (a["sort"] > b["sort"]) ? 1 : 0;
    });
    result = result.concat(sorted);
  });
  
  return result;
}

// @TODO Mark is going to build similar functionality. Replace this when that is done.
function getDepartmentData($data, $deptId) {
  var result = [];
  result['name'] = 'Department Name' + $deptId;
  result['title'] = 'Department Title' + $deptId;
  
  return result;
}

// Prepare parameters for the asurite id solr call.
function createCallParams(ids) {
  return "?dept_id[]=" + ids.join('&dept_id[]=') + "&size=1000";
}

// Create the asurite id checkboxes.
function initialize_tree() {
  var departments = $(".directory-tree").val().split(',');
  var query = createCallParams(departments);
  $.getJSON("/people-in-department"+query, function(json) {
    var existing_values = $('.asurite-tree').val().split(',');
    converted_json = convert_asurite_to_tree(json.results, departments, existing_values);
    $('#asurite-add-options') // listen for event
    .jstree({
      'core' : {
        'data' : converted_json,
        'themes' : { dots: false }
      },
      types: {
        "person": {
          "icon" : "fa fa-user"
        },
        "default" : {
        }
      },
      "plugins" : [ "types" ]
    });
  });
}
// Create the asurite id checkboxes.
function update_tree() {
  var departments = $( ".directory-tree" ).val().split(',');
//  var departments = ['1661','1374'];
  var query = createCallParams(departments);
  $.getJSON("/people-in-department"+query, function(json) {
    // Get existing data.
    var existing_values = $('.asurite-tree').val().split(',');
    converted_json = convert_asurite_to_tree(json.results, departments, existing_values);
    $('#asurite-add-options').jstree(true).settings.core.data = converted_json;
    $('#asurite-add-options').jstree(true).refresh();
  });
}

})(jQuery, Drupal, drupalSettings);