feenance.factory('CollectionSelection', function() {
  var controller  = null;

  return function($collection, $controller, boundId) {
    this.controller = $controller;
    this.boundId    = boundId;
    this.collection = $collection;

    $controller.collectionSelection = this;
    $controller.boundCollection   = $collection.getData();
    $controller.selected = { index: -2 };
    $controller[boundId] = -1;

    $controller.editing = false;

    $controller.cancel = function ()
    {
      $controller.collectionSelection.rollback();
      $controller.editing = false;
    };

    $controller.edit = function ()
    {
      $controller.collectionSelection.copyForRollback();
      $controller.editing = true;
    };

    $controller.newItem = function()
    {
      $controller.collectionSelection.newItem();
    };

    $controller.save = function ()
    {
      $controller.collectionSelection.saveItem();
    };

    $controller.selectItem = function(id)
    {
      return $controller.collectionSelection.selectItem(id);
    }

    $controller.nextPage = function()
    {
      $controller.collectionSelection.collection.getNextPage();
    }


    this.log = function($message) {
      var directiveName = ($controller.directive ? $controller.directive : "_") + "                        ";
      console.log(directiveName.substr(0, 20) + ": " + $message);
    }

    function isSelected(id) {
      return $controller.selected != undefined && $controller.selected.id == id;
    }

    function isAnewRecord() {
      try {
        if ($controller.selected.id != undefined && $controller.selected.id > 0) {
          return false;
        }
      } catch(e) {
      }
      return true;
    }

    $controller.$watch('selected.index',
      function (new_val, old_val) {
        if ( new_val != undefined && new_val >=0 ) {
          $controller.collectionSelection.log("selected.index changed from " + old_val + " to " + new_val);
          $controller.selected = $controller.collectionSelection.collection.getItemAtIndex(new_val);
        }
      }
    );

    $controller.$watch('selected.id',
      function (new_val, old_val) {
        if (new_val != undefined && new_val != old_val) {
          $controller[boundId] = new_val;
        }
      }
    );

    $controller.$watch(boundId,
      function (new_val, old_val) {
        if (new_val != undefined && new_val != old_val) {
          $controller.collectionSelection.log("Watched " + boundId + " changed from " + old_val + " to " + new_val + " in ");
          if (!isSelected(new_val))
            $controller.collectionSelection.selectItem(new_val);
        }
      }
    );

    this.getSelected = function()
    {
      return $controller.selected;
    };

    this.rollback = function()
    {
      angular.extend($controller.selected, rollback);
    };

    this.copyForRollback = function() {
      rollback = angular.copy($controller.selected);
    };

    this.newItem = function()
    {
      $newItem = this.collection.newItem();
      rollback = $controller.selected;
      $controller.selected = $newItem;
      $controller.editing=true;
    };

    this.saveItem = function() {
      if (isAnewRecord()) {

        $controller.selected.$save( function (response)
        {
          $controller.selected = $controller.collectionSelection.collection.add(response);
          $controller.collectionSelection.copyForRollback();
        });

      } else {

        this.collection.saveItem($controller.selected,
            function(response)
            {
              alert("Updated Successfully (CollectionSelection)");
              $controller.collectionSelection.copyForRollback();
              $controller.editing = false;
            },
            function(response)
            {
              alert("Failed to update (CollectionSelection)");
            }
        );
      }
    };

    this.selectItem = function (id) {
      if (id >= 0) {
        $controller.collectionSelection.log("gettingPromisedIndex for id: " + id);
        $controller.selected = $controller.collectionSelection.collection.getPromisedIndex(id);
        $controller.collectionSelection.log("gettingPromisedIndex returned: " + $controller.selected.index);
      }

      return $controller.selected;
    };
  }
});
