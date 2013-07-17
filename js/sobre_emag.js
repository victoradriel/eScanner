/**
 * @author Victor Adriel de J. Oliveira
 */

(function(){	
	$(".links a:first").click(function(){
		chrome.tabs.create({'url': 'http://www.governoeletronico.gov.br/biblioteca/arquivos/e-mag-3.0/download'}, function(tab){ });
	});
	$(".links a:last").click(function(){
		chrome.tabs.create({'url': 'http://www.governoeletronico.gov.br/acoes-e-projetos/e-MAG'}, function(tab){ });
	});			
})();
