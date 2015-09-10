/**
 * Created by mark on 13/12/2014.
 */

feenance.factory('Collection', function() {

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