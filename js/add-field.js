(function ($, Drupal, drupalSettings) {
  var converted_json;

  Drupal.behaviors.webdirAddField = {
    attach: function (context, settings) {
      // Check if there are directory type fields.
      if ($(context).find('.asurite-add').length) {
        $('.asurite-add').each(function (index) {
          var default_values = [];
          // Convert and check the default values.
          initialize_tree();
          $(".directory-tree").on('change', function () {
            // Update the tree.
            update_tree();
          });

          // Add people from Asurite Add field.
          $("#asurite-add-options").on("select_node.jstree", function (e, data) {
            if (data.node.id.includes(":")) {
              // Get the existing values
              default_values = $('.asurite-tree').val().split(',');
              // Add the person to the tree.
              default_values.push(data.node.id);
              // Recreate tree with the default values.
              update_tree();
            }
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
          let title = department_data['title'];
          if (title == null && element.primary_title !== undefined) {
            title = element.primary_title.raw[0];
          }

          if (!temp.hasOwnProperty('preresults')) {
            temp.preresults = [];
          }

          if (departments.length > 1) {
            if (typeof element.deptids !== 'undefined' &&
              element.deptids.raw !== null &&
              element.deptids.raw.length > 0) {
              let matches = getArrayIntersection(element.deptids.raw, departments);
              if (matches.length > 1) {
                let p = {};
                if (temp.preresults.filter(el => el.id === element.asurite_id.raw).length < 1) {
                  p.id = element.asurite_id.raw;
                  p.parent = '#';
                  p.text = element.display_name.raw + ', ' + element.asurite_id.raw;
                  p.sort = element.last_name.raw;
                  p.type = 'person';
                  temp.preresults.push(p);
                }
                let child = {};
                if (temp.preresults.filter(el => el.id === element.asurite_id.raw + ':' + deptid).length < 1) {
                  let index = element.deptids.raw.indexOf(deptid);
                  child.id = element.asurite_id.raw + ':' + deptid;
                  child.parent = element.asurite_id.raw;
                  child.text = title + ', ' + element.departments.raw[index];
                  child.sort = element.last_name.raw;
                  child.type = 'dept';
                  temp.preresults.push(child);
                }
              } else {
                createNewElement();
                temp.preresults.push(new_element);
              }
            }
          } else {
            createNewElement();
            temp.preresults.push(new_element);
          }

          function createNewElement() {
            // profile
            new_element.id = element.asurite_id.raw + ':' + deptid;
            new_element.parent = '#';
            new_element.sort = element.last_name.raw;
            new_element.text = element.display_name.raw + ', ' + element.asurite_id.raw +
              ', ' + department_data['name'] + ', ' + title;
            new_element.type = "person";
          }
        }
      });
    });

    // Sort the temp into result.
    let presort = temp.preresults;
    if (presort !== undefined) {
      let sorted = presort.sort(function (a, b) {
        return (a["sort"] < b["sort"]) ? -1 : (a["sort"] > b["sort"]) ? 1 : 0;
      });
      return sorted;
    }
    else {
      return null;
    }
  }

  function getArrayIntersection(a1,a2) {
    return  a1.filter(function(n) { return a2.indexOf(n) !== -1;});
  }

  function getDepartmentData($data, $deptId) {
    var result = [];
    let deptindex = $data.deptids.raw.indexOf($deptId);
    result['name'] = $data.departments.raw[deptindex];
    result['title'] = $data.titles.raw[deptindex];

    return result;
  }

  // Prepare parameters for the asurite id solr call.
  function createCallParams(ids) {
    return "?dept_id[]=" + ids.join('&dept_id[]=') + "&size=100";
  }

  // Create the asurite id checkboxes.
  function initialize_tree() {
    var departments = $(".directory-tree").val().split(',');
    var query = createCallParams(departments);
    $.getJSON("/endpoint/people-in-department" + query, function (json) {
      var existing_values = $('.asurite-tree').val().split(',');
      converted_json = convert_asurite_to_tree(json.results, departments, existing_values);
      $('#asurite-add-options') // listen for event
        .jstree({
          'core': {
            'data': [],
            'themes': { dots: false },
            'check_callback': true
          },
          types: {
            "person": {
              "icon": "fa fa-user"
            },
            "dept": {
              "icon": "fa fa-bookmark"
            },
            "default": {
            }
          },
          "plugins": ["types"]
        });
    });
  }

  // Create the asurite id checkboxes.
  function update_tree() {
    var departments = $(".directory-tree").val().split(',');
    //  var departments = ['1661','1374'];
    var query = createCallParams(departments);
    $.getJSON("/endpoint/people-in-department" + query, function (json) {
      // Get existing data.
      if ($('.asurite-tree').val() !== undefined) {
        var existing_values = $('.asurite-tree').val().split(',');
        converted_json = convert_asurite_to_tree(json.results, departments, existing_values);
        $('#asurite-add-options').jstree(true).settings.core.data = converted_json;
        $('#asurite-add-options').jstree(true).refresh();
      }
    });
  }

})(jQuery, Drupal, drupalSettings);
