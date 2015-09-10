var restitute = angular.module("restitute", []);
/**
 * Created by mark on 13/12/2014.
 */

restitute.factory('Collection', function() {

    return function (api, $initialText) {
        var collection = { data: [] };
        var fetchAllPages = false;
        var nextPage = null;

        if ($initialText) {
            collection.data[0] = {id: 0, name: $initialText};
        }

        var promises = {};

        /*
         * promises are a set of objects that will contain the index of an account, once the accounts are returned
         * from the ajax call.
         * This private method is called post ajax return to populate all of the promises
         */
        function _updatePromises() {
            console.log("updating promises");

            angular.forEach(collection.data,
                function(value, key)
                {
                    if (promises[value.id] != undefined) {
                        console.log("updating promise    : id: " + value.id + " to index: " + key);
                        promises[value.id].index = key;
                    }
                }
            );
        }

        /*
         * This private method sets a promise and populates it if data is available,
         * otherwise it waits until the promises are fetched and _updatePromises is called
         */
        function _setPromise(promise, id) {
            angular.forEach(collection.data,
                function(value, key)
                {
                    if (value.id == id) {
                        console.log("setting  promise found for index: " + key + " to id: " + id);
                        promise.index = key;
                    }
                }
            );
            return promise;
        }

        this.newItem = function()
        {
            return new api;
        };

        this.saveItem = function ($item, successCallback, failCallback)
        {
            api.update(
                { id:$item.id   },
                $item,
                successCallback,
                failCallback
            );
        };

        this.getData = function()
        {
            return collection.data;
        };

        this.add = function(record)
        {
            collection.data.push(record);
            return record;
        };

        this.getPromisedIndex = function (id)
        {
            if (promises[id] != undefined) {
                console.log("found promise       : id: " + id + " to index: " + promises[id].index);
                return promises[id];
            }
                console.log("creating promise    : id: " + id + " to index: -1");
            promises[id] = {index: -1};
            return _setPromise(promises[id], id);
        };

        this.getItemAtIndex = function (index)
        {
            return collection.data[index];
        }

    // NOW GET THE DATA
        var getPage = function($page)
        {
            var results = api.get({ page: $page }, function ()
            {
                for (var i = 0; i < results.data.length; i++)
                {
                    results.data[i].page = $page;
                    collection.data.push(results.data[i]);

                }

                if (results.paginator && results.paginator.next)
                {
                    nextPage = results.paginator.next;
                    if (fetchAllPages) {
                        getNextPage();
                    }
                } else {
                    nextPage = null;
                }
                _updatePromises();
            });
        }

        var getNextPage = function()
        {
            if (nextPage) {
                getPage(nextPage);
            }
            return this;
        };

        getPage(1);

        this.fetchAll = function() {
            fetchAllPages = true;
            getNextPage();
            return this;
        }
        this.getNextPage = getNextPage;
    };
});
restitute.factory('CollectionSelection', function() {
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
