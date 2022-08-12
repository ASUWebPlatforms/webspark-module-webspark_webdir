(function ($, Drupal, drupalSettings) {
  var converted_json;

  Drupal.behaviors.webdirListField = {
    attach: function (context, settings) {
      // Check if there are directory type fields.
      if ($(context).find('.asurite-list').length) {
        $('.asurite-list').each(function(index) {
          // Convert and check the default values.
          initialize_tree();
          $(".directory-tree").on('change', function() {
            // Update the tree.
            update_tree();
          });
          $(".campus-tree").on('change', function() {
            // Update the tree.
            update_tree();
          });
          $(".expertise-tree").on('change', function() {
            // Update the tree.
            update_tree();
          });
          $(".employee-type-tree").on('change', function() {
            // Update the tree.
            update_tree();
          });
          $(".field--name-field-filter-title textarea").on('change', function() {
            // Update the tree.
            update_tree();
          });
        });
      }
    }
  };

// Convert the json from the asuriteid to be compatible with the jstree.
function convert_asurite_to_tree(data, departments) {
  var result = [];
  var temp = {};
  $(data).each(function (i, element) {
    if (element.hasOwnProperty('deptids')) {
      $(element.deptids.raw).each(function (j, deptid) {
        var new_element = {};
        if (departments.includes(deptid)) {

          var department_data = getDepartmentData(element, deptid);
          let title = department_data['title'];
          if (title == null) {
            title = element.primary_title.raw[0];
          }

          new_element.id = element.asurite_id.raw + ':' + deptid;
          // Remove maybe.
          new_element.sort = element.last_name.raw;
          new_element.text = element.display_name.raw + ', ' + element.asurite_id.raw +
                  ', ' + department_data['name']+ ', ' + title;
          new_element.type = "person";
          if (!temp.hasOwnProperty(deptid)) {
            temp[deptid] = [];
          }
          temp[deptid].push(new_element);
        }
      });
    }
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

function getDepartmentData($data, $deptId) {
  var result = [];
  result['name'] = $data.departments.raw[0];
  result['title'] = $data.titles.raw[0];

  return result;
}

// Prepare parameters for the asurite id solr call.
function createCallParams(departments, campuses, expertise, employeeTypes, titles, size, page) {
  var filters = '';

  // Add departments.
  filters = filters + "?dept_ids=" + departments.join(',');
  // Add campuses
  if (campuses.length > 0) {
    filters = filters + "&campuses=" + campuses.join(',');
  }
  // Add expertise
  if (expertise.length > 0) {
    filters = filters + "&expertise_areas=" + expertise.map((value) => encodeURIComponent(value)).join(',');
  }
  // Add employee types
  if (employeeTypes.length > 0) {
    filters = filters + "&employee_types=" + employeeTypes.map((value) => encodeURIComponent(value)).join(',');
  }
  // Add titles
  if (titles.length > 0) {
    filters = filters + "&title=" + titles.join(',');
  }

  if (size > 0) {
    filters = filters + "&size=" + size;
  }
  if (page > 0) {
    filters = filters + "&page=" + page;
  }

  return filters + "&sort-by=last_name_asc";
}

// Create the asurite id checkboxes.
function initialize_tree() {

  $('#asurite-list-options') // listen for event
  .jstree({
    'core' : {
      'data' : [],
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
}

// Create the asurite id checkboxes.
function update_tree() {
  const departments = $(".directory-tree").val().split(',');
  const campuses = $(".campus-tree").val().split(',');
  const expertise = $(".expertise-tree").val().split('|');
  const employeeTypes = $(".employee-type-tree").val().split('|');
  const titles = $(".field--name-field-filter-title textarea").val().split('\n');
  const size = 1500;
  const page = 1;
  const query = createCallParams(departments, campuses, expertise, employeeTypes, titles, size, page);

  $.getJSON("/endpoint/filtered-people-in-department"+query, function(json) {
    // Get existing data.
    converted_json = convert_asurite_to_tree(json.results, departments);
    $('#asurite-list-options').jstree(true).settings.core.data = converted_json;
    $('#asurite-list-options').jstree(true).refresh();
  });
}

})(jQuery, Drupal, drupalSettings);
