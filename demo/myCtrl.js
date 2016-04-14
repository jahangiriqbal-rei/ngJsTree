(function(angular) {
  'use strict';

  //// JavaScript Code ////
  function myCtrl($log, $timeout, $scope, $http, $q, toaster) {
    var vm = this
      //api service method
    $scope.call = function(oApiParam) {
      var deferred = $q.defer();

      $http({
          'method': oApiParam.method,
          'url': oApiParam.url,
          'params': oApiParam.oParams,
          'data': oApiParam.oData
        })
        .success(function(data) {
          deferred.resolve(data);
        }).error(function(msg, code) {
          deferred.reject(msg);
          $log.error(msg, code);
        });

      return deferred.promise;
    };

    //DHS id, dept of homeland sec 
    var orgID = '100011942';
    var params = {
      url: 'http://192.168.56.103:8080/api/federalHierarchies/' + orgID + '?childrenLevels=1',
      apiSuffix: '',
      oParams: {},
      oData: {},
      method: 'GET'
    };


    $scope.call(params).then(function(data) {
      //format expects an array. thats why we converted the obj to an array
      var formattedData = formatAgencyData([data]);
      console.log('fh data, formatted', formattedData);
      $scope.treeData = formattedData;
      instantiateTree();
    });


    function formatAgencyData(dataArray) {
      var keyMapping = {
        "hierarchy": "children",
        "name": "text",
        "sourceOrgId": "id"
      };

      var formattedData = _.map(dataArray, function(currentObj) {
        var tmpObj = {};
        for (var property in currentObj) {
          //do recursion
          if (property == "hierarchy") {
            currentObj.hierarchy = formatAgencyData(currentObj.hierarchy);
          }

          //rename keys
          if (keyMapping.hasOwnProperty(property)) {
            tmpObj[keyMapping[property]] = currentObj[property];
          } else {
            tmpObj[property] = currentObj[property];
          }
        }
        return tmpObj;
      });


      return formattedData;
    }




    //callbacks --
    $scope.treeEventsObj = {
      'changed': changedNodeCB,
      'ready': readyCB

    };

    function readyCB() {
      $timeout(function() {
        toaster.pop('success', 'JS Tree Ready', 'Js Tree ia.sfjkas;dfldsssued the ready event')

        $scope.$watch('searchText', function() {

          var q = ($scope.searchText) ? $scope.searchText : '';
          vm.treeInstance23.jstree(true).search(q);
        });
      });
    };

    function changedNodeCB(e, data) {
      var node = data.node;
      //only make ajax call if data currently does not have children, dont make calls for stuff thats already loaded
      //THIS MIGHT BE NOT CORRECT TO DO.. REVISIT THIS LATER..
      if (!node.children || node.children.length == 0) {
        var elementId = node.original.elementId;
        //make api call, get data, put it under the correct parent
        var gotoUrl = 'http://192.168.56.103:8080/api/federalHierarchies/' + elementId + '?childrenLevels=1';
        params = {
            url: gotoUrl,
            apiSuffix: '',
            oParams: {},
            oData: {},
            method: 'GET'
          }
          //this data argument is local to this function
        $scope.call(params).then(function(data) {
          var parentId = node.original.id;
          if (data.hierarchy && data.hierarchy.length > 0) {
            //grab the children, already an array. so dont need to convert ot an array
            var formattedData = formatAgencyData(data.hierarchy);
            _.forEach(formattedData, function(value, key, collection) {
              value.parent = parentId;
              $scope.treeData.push(value);
            });

            console.log("got children and pushed them onto scope.treeData", $scope.treeData);
          } else {
            console.log("no children!!!! --");
          }

        });
      } else {
        console.log("already have children loaded!!");
      }
    }

    function instantiateTree() {
      $scope.treeConfig = {
        core: {
          multiple: true,
          animation: true,
          error: function(error) {
            $log.error('treeCtrl: error from js tree - ' + angular.toJson(error));
          },
          check_callback: true,
          worker: true
        },
        types: {
          default: {
            icon: 'glyphicon glyphicon-flash'
          },
          DEPARTMENT: {
            icon: 'glyphicon glyphicon-star'
          },
          AGENCY: {
            icon: 'glyphicon glyphicon-cloud'
          },
          OFFICE: {
            icon: 'glyphicon glyphicon-tree-conifer'
          }
        },
        version: 1,
        checkbox: {
          // cascade: 'up'
          three_state: false
        },
        plugins: ['types', 'checkbox', 'search']
      };
    }

  } //END OF CTRL FUNCTION


  //// Angular Code ////
  var myApp = angular.module('ngJsTreeDemo');
  myApp.controller('myCtrl', myCtrl);

})(angular);
