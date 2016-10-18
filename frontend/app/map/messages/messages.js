(function(fp, $, ng, undefined) {

	fp.app.factory("fpMapMessages", [ "$rootScope", "$templateCache", "$compile", function($rootScope, $templateCache, $compile) {
		return function(map) {
			var scope = $rootScope.$new(true);
			scope.messages = [ ];

			var el = $($templateCache.get("map/messages/messages.html")).insertAfter(map.map.getContainer());
			$compile(el)(scope);
			scope.$evalAsync(); // $compile only replaces variables on next digest

			return {
				showMessage : function(type, message, buttons, lifetime, onclose) {
					var messageObj = {
						type: type,
						message: message,
						buttons: buttons,
						close: function(callOnClose) {
							var idx = scope.messages.indexOf(messageObj);
							if(idx != -1)
								scope.messages = scope.messages.slice(0, idx).concat(scope.messages.slice(idx+1));

							callOnClose && onclose && onclose();

							scope.$evalAsync();
						}
					};

					scope.messages.push(messageObj);
					scope.$evalAsync();

					if(lifetime) {
						setTimeout(function() {
							messageObj.close();
						}, lifetime);
					}


					return messageObj;
				}
			};
		};
	} ]);

})(FacilPad, jQuery, angular);