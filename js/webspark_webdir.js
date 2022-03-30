(function ($, Drupal, once) {

  Drupal.behaviors.webSparkWebDir = {
    attach: function (context, settings) {
      var componentLoaded = typeof webdirUI !== "undefined" && typeof webdirUI.initSearchPage !== "undefined";

      if (!componentLoaded) {
        return;
      }

      const elements = once('webSparkWebDir', '.webdir-container', context);

      elements.forEach((value, index) => {
        props = {
          searchType: value.dataset.searchType,
          searchURL: value.dataset.searchUrl,
          peopleSearch: value.dataset.peopleSearch,
          ids: value.dataset.asuriteIds,
          deptIds: value.dataset.deptIds,
          filters: {
            employee: value.dataset.filterEmployee,
            expertise: value.dataset.filterExpertise,
            title: value.dataset.filterTitle
          },
          display: {
            defaultSort: value.dataset.defaultSort,
            usePager: value.dataset.usePager,
            profilesPerPage: value.dataset.profilesPerPage,
            doNotDisplayProfiles: value.dataset.doNotDisplayProfiles,
          }
        };

        webdirUI.initWebDirectory({
          targetSelector: "#" + value.id,
          props: props,
        });
      });
    }
  };
})(jQuery, Drupal, once);
