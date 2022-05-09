(function ($, Drupal, drupalSettings) {

  Drupal.behaviors.webdirAddPeopleField = {
    attach: function (context, settings) {
      // Check if there are directory type fields.
      if ($(context).find('.asurite-add-people').length) {
        $('.asurite-add-people').each(function (index) {
          // Convert and check the default values.
          initialize_tree();

          let search_timeout = null;
          $(".field--name-field-people-search input").keyup(function () {
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

        });
      }
    }
  };

  // Create the asurite id checkboxes.
  function initialize_tree() {
    $('#asurite-add-people-options') // listen for event
      .jstree({
        'core': {
          'data': [],
          'themes': { dots: false },
          'check_callback': true,
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
  }

  function searchPeople(queryString) {
    var query = "?query=" + queryString + "&size=20";
    $.getJSON("/endpoint/search-staff" + query, function (json) {
      if (json.results.length > 0) {
        var d = [];
        json.results.forEach(el => {
          let p = {};

          p.id = el.asurite_id.raw;
          p.parent = '#';
          p.text = el.display_name.raw + ', ' + el.asurite_id.raw;
          p.type = 'person';

          // Departments.
          if (typeof el.deptids !== 'undefined' &&
            el.deptids.raw !== null &&
            el.deptids.raw.length > 0
          ) {
            el.deptids.raw.forEach(function (dt, index) {
              let child = {};
              child.id = el.asurite_id.raw + ':' + dt;
              child.parent = el.asurite_id.raw;
              child.text = el.titles.raw[index] + ', ' + el.departments.raw[index];
              child.type = 'dept';

              d.push(child);
            });
          }

          d.push(p);
        });
      }

      update_tree(d);
    });
  }

  // Create the asurite id checkboxes.
  function update_tree(json) {
    // Get existing data.
    $('#asurite-add-people-options').jstree(true).settings.core.data = json;
    $('#asurite-add-people-options').jstree(true).refresh();
  }

})(jQuery, Drupal, drupalSettings);
