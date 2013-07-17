/**
 * @author Victor Adriel de J. Oliveira
 */

$().ready(function(){	
	$(".links a#tuto_alt").click(function(){
		chrome.tabs.create({'url': 'http://www.governoeletronico.gov.br/biblioteca/arquivos/o-uso-correto-do-texto-alternativo'}, function(tab){ });
	});
	$(".links a#tuto_table").click(function(){
		chrome.tabs.create({'url': 'http://www.governoeletronico.gov.br/biblioteca/arquivos/tabelas-acessiveis'}, function(tab){ });
	});
	$(".links a#tuto_form").click(function(){
		chrome.tabs.create({'url': 'http://www.governoeletronico.gov.br/biblioteca/arquivos/formularios-acessiveis'}, function(tab){ });
	});	
})();
