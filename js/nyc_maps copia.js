var kpi_list = []
var server_host="https://sheltered-peak-36566.herokuapp.com/"
	
	
var projection, zoom, drag ;

var colorRange = ["#ffff00", "#FFA500","#cc0000"];
var data_street;
var data_area;

var kpi_column_list=[]

$(document).ready(function(){
	var options={
		format: 'dd/mm/yyyy',
		todayHighlight: true,
		autoclose: true
	};
	  
	$('#street_date_to,#street_date_from,#area_date_to,#area_date_from').datepicker(options);
	$('#street_date_to,#area_date_to').datepicker('update', new Date());
	
	$('#street_date_from,#area_date_from').datepicker('update', new Date(2017,0,1,0,0,0));
	$("#street_apply,#street_kpi_list,#street_scale_list,#area_apply,#area_kpi_list,#area_scale_list").prop('disabled', true);
	
	$(".sliders_street,.sliders_area").hide()
	$("#street_kpi_slider,#area_kpi_slider").slider({});
	$("#street_kpi_slider,#area_kpi_slider").slider("disable")
	
	
	$("#street_apply").on("click",function(){
		$("#street_apply,#street_kpi_list,#street_scale_list").prop('disabled', true);
		$("#street_loader").slideDown();
		var date_from = $("#street_date_from").datepicker("getDate").toISOString()
		var date_to= $("#street_date_to").datepicker("getDate").toISOString()
		var data = {"date":{"from":date_from,"to":date_to}}
		postRequest("crash_by_street",data,mapStreetCallback)
	})
	
	$("#street_kpi_list").on("change",function(){
		if(data_street!=null) mapStreetCallback(data_street)
	})

	$("#street_scale_list").on("change", function(){
		updateColorMapStreet(data_street, "#street_kpi_slider",  "#street_scale_list","#street_kpi_list")
		drawColorScale("#legend_street_map","#street_kpi_slider","#street_scale_list")
	})
	
	$("#street_kpi_slider").on("slide",function(slideEvt){
		$("#street_kpi_slider_range").text(slideEvt.value);
	})
	$("#street_kpi_slider").on("slideStop",function(slideEvt){
		
		if(slideEvt.value[0] == 0 && slideEvt.value[1]==0 ){
			$(".street").css("opacity","1")
		}else{
			if(slideEvt.value[0] == 0) $(".street").css("opacity","1")
			else $(".street").css("opacity","0")
			$.each(data_street, function(index, item){
				var kpi= $("#street_kpi_list").val()
				if(slideEvt.value[0] == 0 && item[kpi]>slideEvt.value[1] ){
						$("#street_id_"+item._id.id).css("opacity","0")
				}
				if(slideEvt.value[0] != 0 && item[kpi]>=slideEvt.value[0] && item[kpi]<=slideEvt.value[1] ){
					$("#street_id_"+item._id.id).css("opacity","1")
				}
			})
		}
	})
	
	
	
	$.each(["borough_boundaries","postal_code","tracts"], function (index, value) {
	    $('#area_granularity_list').append($('<option/>', { 
	        value: value,
	        text : (value+"").replace("_"," ").replace(/\b\w+/g,function(s){return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();})
	    }));
	    if(value == "postal_code"){
	    		$('#area_granularity_list').val(value)
	    }
	}); 
	
	$("#area_apply").on("click",function(){
		$("#area_apply,#area_kpi_list,#area_scale_list").prop('disabled', true);
		$("#area_loader").slideDown();
		var date_from = $("#area_date_from").datepicker("getDate").toISOString()
		var date_to= $("#area_date_to").datepicker("getDate").toISOString()
		
		var area_type="";
		switch($('#area_granularity_list').val()) {
		    case "borough_boundaries":
		    		area_type="borough";
		    		break;
		    case "postal_code":
	    			area_type="zipcode";
		    		break;
		    case "tracts":
	    			area_type="tract";
		    		break;
		}
		
		var data = {"area_type":area_type,"date":{"from":date_from,"to":date_to}}
		postRequest("crash_by_area",data,mapAreaCallback)
	})
	
	$("#area_kpi_list").on("change",function(){
		if(data_area!=null) mapAreaCallback(data_area)
	})

	$("#area_scale_list").on("change", function(){
		updateColorMapArea(data_area, "#area_kpi_slider",  "#area_scale_list","#area_kpi_list")
		drawColorScale("#legend_area_map","#area_kpi_slider","#area_scale_list")
	})
	
	$("#area_kpi_slider").on("slide",function(slideEvt){
		$("#area_kpi_slider_range").text(slideEvt.value);
	})
	
	$("#area_kpi_slider").on("slideStop",function(slideEvt){
		if(slideEvt.value[0] == 0 && slideEvt.value[1]==0 ){
			$(".subarea").css("opacity","1")
		}else{
			if(slideEvt.value[0] == 0) $(".subarea").css("opacity","1")
			else $(".subarea").css("opacity","0")
			$.each(data_area, function(index, item){
				var kpi= $("#area_kpi_list").val()
				if(slideEvt.value[0] == 0 && item[kpi]>slideEvt.value[1] ){
						$("#area_id_"+item._id.id).css("opacity","0")
				}
				if(slideEvt.value[0] != 0 && item[kpi]>=slideEvt.value[0] && item[kpi]<=slideEvt.value[1] ){
					$("#area_id_"+item._id.id).css("opacity","1")
				}
			})
		}
	})
	
	  
	postRequest("dashboardsParameters",{},dahboardParams)
	
	projection = d3.geo.mercator()
					.center([-73.86, 40.755])
					.scale(67000);
	  
	queue()
		.defer(d3.json, 'resources/nyc_area.min.topojson')
		.defer(d3.json, 'resources/nyc_boundaries.min.topojson')
		.defer(d3.json, 'resources/nyc_road_internal_name_not_null.min.topojson')
		.await(drawStreetMap);
	
	$('#area_granularity_list').on("change",function(){
		
		var topojson;
		switch($('#area_granularity_list').val()) {
		    case "borough_boundaries":
		    		topojson="resources/nyc_boundaries.min.topojson"
		        break;
		    case "postal_code":
		        topojson='resources/nyc_zipcode.min.topojson'
		        break;
		    case "tracts":
		    		topojson="resources/nyc_tracts.min.topojson"
		        break;
		}
		queue()
			.defer(d3.json, 'resources/nyc_area.min.topojson')
			.defer(d3.json, topojson)
			.await(drawAreaMap);
	})
	
	$('#area_granularity_list').change()

})


function zoomed() {
  container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  slider.property("value",  d3.event.scale);
}

function slided(d,svg){
  zoom.scale(d3.select(this).property("value")).event(svg);
}


function postRequest(service,data,callback){
	$.ajax({  
        type: "POST",  
        url: server_host+service,  
        dataType: "json",
        async: true,
        data: data,  
        success: callback
    });    
}

function dahboardParams(data){	
	$.each(data.kpi_list, function (index, value) {
	    $('#street_kpi_list,#area_kpi_list').append($('<option/>', { 
	        value: value,
	        text : (value+"").replace("_"," ").replace(/\b\w+/g,function(s){return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();})
	    }));
	    if(value == "crash"){
	    		$('#street_kpi_list,#area_kpi_list').val(value)
	    }
	});  
	

	
	$.each(data.scale_list, function (index, value) {
	    $('#street_scale_list,#area_scale_list').append($('<option/>', { 
	        value: value,
	        text : (value+"").replace("_"," ").replace(/\b\w+/g,function(s){return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();})
	    }));
	    if(value == "logaritmic"){
	    		$('#street_scale_list').val(value)
	    }
	    if(value == "linear"){
    			$('#area_scale_list').val(value)
	    }
	});  
}

function drawStreetMap(err,area,boundaries,streets){
	d3.select('#street_map').selectAll("*").remove();
	
	var zoom = d3.behavior.zoom().scaleExtent([1, 8]).on("zoom", function() {
	    svg.attr("transform",
		        "translate(" + zoom.translate() + ")" +
		        "scale(" + zoom.scale() + ")"
		    );
		});
	
	var svg = d3.select('#street_map').call(zoom).append("g");
	 
	var path = d3.geo.path()
		.projection(projection);
	
	svg.append('path')
		.datum(topojson.feature(area, area.objects.collection))
			.attr('d', path)
			.attr('class', 'area');
	
	svg.append('path')
		.datum(topojson.feature(boundaries, boundaries.objects.collection))
		.attr('d', path)
		.attr('class', 'nyc');
	
	svg.selectAll("path")
		.data(topojson.feature(streets, streets.objects.collection).features)
		.enter().append("path")
		.attr("d", path)
		.attr("class", "street")
		.attr("id",function (el){
			return "street_id_"+el.properties.id;
		}) ;
	svg.selectAll("path.street")
		.append("svg:title")
		.attr("class","tooltip")
		.style("fill","black")
		.text(function(el) { return el.properties.n; });
	
	svg.selectAll("path.street")
		.on('mouseover', function(d){
		    d3.select(this).style({"stroke-width":'3'});
		})
		.on('mouseout', function(d){
		    d3.select(this).style({"stroke-width":'0.25'});
		})
		
	$('#table_street').bootstrapTable({
		icons:{
			  paginationSwitchDown: 'glyphicon-collapse-down icon-chevron-down',
			  paginationSwitchUp: 'glyphicon-collapse-up icon-chevron-up',
			  refresh: 'glyphicon-refresh icon-refresh',
			  toggle: 'glyphicon-list-alt icon-list-alt',
			  columns: 'glyphicon-th icon-th',
			  detailOpen: 'glyphicon-plus icon-plus',
			  detailClose: 'glyphicon-minus icon-minus'
			},
		showColumns:true,
		showToggle:true,
		clickToSelect:true,
		singleSelect:true,
		
		columns: [
			{checkbox:true},
			{field: '_id.id',
	        title: 'ID',
		    sortable:true,
		    visible:true,
		    align:"left"},
		    {field: '_id.name',
		        title: 'Name',
			    sortable:true,
			    visible:true,
			    align:"left"},
		    {field: '_id.length',
		        title: 'Length (Km)',
			    sortable:true,
			    visible:true,
			    align:"right",
		    	formatter: function(el){return Number(Math.round(el+'e3')+'e-3').toFixed(3)}},
		    {field: 'crash',
			        title: 'Crash',
				    sortable:true,
				    visible:true,
				    align:"right"},
		    {field: 'involved_vehicle',
		        title: 'Involved Vehicle',
			    sortable:true,
			    visible:true,
			    align:"right"},
		    {field: 'person_injured',
		        title: 'Person Injured',
			    sortable:true,
			    visible:true,
			    align:"right"},
		    {field: 'person_killed',
		        title: 'Person Killed',
			    sortable:true,
			    align:"right"},
		    {field: 'pedestrian_injured',
		        title: 'Pedestrian Injured',
			    sortable:true,
			    visible:false,
			    align:"right"},
		    {field: 'pedestrian_killed',
		        title: 'Pedestrian Killed',
			    sortable:true,
			    visible:false,
			    align:"right"},
		    {field: 'cyclist_injured',
		        title: 'Cyclist Injured',
			    sortable:true,
			    visible:false,
			    align:"right"},
		    {field: 'cyclist_killed',
		        title: 'Cyclist Killed',
			    sortable:true,
			    visible:false,
			    align:"right"},
			    
		    {field: 'motorist_injured',
		        title: 'Motorist Injured',
			    sortable:true,
			    visible:false,
			    align:"right"},
		    {field: 'motorist_killed',
		        title: 'Motorist Killed',
			    sortable:true,
			    visible:false,
			    align:"right"},
		],
	    pagination:true,
	    locale:'en-US',
	    striped:true,
	    search:true,
	    onCheck: function (item) {
	    		$(".street").css("opacity",0.05);
	    		$("#street_id_"+item._id.id).css("opacity",1);
	    		$("#street_id_"+item._id.id).css("stroke-width",3);
	    },
	    onUncheck: function (item) {
	    		$(".street").css("opacity",1);
	    		$(".street").css("stroke-width",0.25);
    		}
    	});
	
	$('#table_street').bootstrapTable('removeAll');

	$("#street_apply,#street_kpi_list").prop('disabled', false);
	$("#street_loader").slideUp();
	
}

function drawColorScale(selector,selector_slider,selector_scale) {
  var width = 350,
	  height = 50;
  
  d3.select(selector).selectAll("*").remove();
  var svg = d3.select(selector)
  
  var value_slider=$(selector_slider).slider("getValue")
  var max = value_slider[1]
  var interval = max / 31
  var data_legend= [];
  for(var i=0;i<32;i++){
	  data_legend.push(i*interval)
  }
  
  var color = getColorScale(selector_scale, max)
  
  var ls_w = 9, ls_h = 30;
  var legend = svg.selectAll("g.legend")
  .data(data_legend)
  .enter().append("g")
  .attr("class", "legend");
  
  legend.append("rect")
	  .attr("y", 0)
	  .attr("x", function(d, i){ return i*ls_w })
	  .attr("width", ls_w)
	  .attr("height", ls_h)
	  .style("fill", function(d, i) { if( d == 0 ){return "#00cc00"};return color(d); })
	  .style("opacity", 0.8);
  legend.selectAll("rect")
	.append("svg:title")
	.text(function(el) { return Math.round(el); });
 }

function mapStreetCallback(data){
	$(".sliders_street").hide()
	$(".street").css("stroke","#00cc00")
	$(".street").css("opacity","1")

	$("#street_kpi_slider").slider("disable")

	data_street = data
	var kpi= $("#street_kpi_list").val()
	
	var min = 0;
	var max = d3.max(data, function(d) { return d[kpi]; })
	
	if(min == null){min = 0}
	if(max == null){max = min}
	
	
	$("#street_kpi_slider").slider('setAttribute', 'min', 0);
	$("#street_kpi_slider").slider('setAttribute', "max",max);
	$("#street_kpi_slider").slider('setValue', [min,max]);
	$("#street_kpi_slider_range").text($("#street_kpi_slider").slider("getValue"));
	
	if((min == max && max == 0) == false){
		updateColorMapStreet(data, "#street_kpi_slider",  "#street_scale_list","#street_kpi_list")
	}	
	drawColorScale("#legend_street_map","#street_kpi_slider","#street_scale_list")
	$("#street_apply,#street_kpi_list,#street_scale_list").prop('disabled', false);
	$("#street_loader").slideUp();
	$("#street_kpi_slider").slider("enable")
	$(".sliders_street").show()	
	
	$('#table_street').bootstrapTable('load',data);
}

function getColorScale(selector, max){
	var scale= $(selector).val()
	if (scale == "logaritmic") return d3.scale.log().domain([1,Math.round((1+max)/2),max]).range(colorRange).interpolate(d3.interpolateHsl);
	else if (scale == "linear") return d3.scale.linear().domain([1,Math.round((1+max)/2),max]).range(colorRange).interpolate(d3.interpolateHsl);
	else if (scale == "sqrt") return d3.scale.sqrt().domain([1,Math.round((1+max)/2),max]).range(colorRange).interpolate(d3.interpolateHsl);
}

function updateColorMapStreet(data, selector_slider,  selector_scale, selector_kpi){
	var kpi= $(selector_kpi).val()
	var max=$(selector_slider).slider("getValue")[1]
	var color = getColorScale(selector_scale,max)
	$.each(data, function(index, item){
		if(item[kpi]>0){
			$("#street_id_"+item._id.id).css("stroke",color(item[kpi]))
		}else{
			$("#street_id_"+item._id.id).css("stroke","#00cc00")
		}
	})
}

function drawAreaMap(err,area,zipcodes){
	d3.select('#area_map').selectAll("*").remove();
	$(".sliders_area").hide()
	$("#area_kpi_slider").slider({});
	$("#area_kpi_slider").slider("disable")
	$('#bootstrap-table').hide()
	
	var zoom = d3.behavior.zoom().scaleExtent([1, 8]).on("zoom", function() {
	    svg.attr("transform",
		        "translate(" + zoom.translate() + ")" +
		        "scale(" + zoom.scale() + ")"
		    );
		});
	
	var svg = d3.select('#area_map').call(zoom).append("g");
	 
	var path = d3.geo.path()
		.projection(projection);

		
	
	svg.selectAll("path")
		.data(topojson.feature(zipcodes, zipcodes.objects.collection).features)
		.enter().append("path")
		.attr("d", path)
		.attr("class", "subarea")
		.attr("id",function (el){
			switch($('#area_granularity_list').val()) {
			    case "borough_boundaries":
			    		return "area_id_"+el.properties.a;
			    case "postal_code":
			    		return "area_id_"+el.properties.p; 
			    case "tracts":
			    		return "area_id_"+el.properties.g; 
			}
		}) ;
	
	svg.selectAll("path.subarea")
		.append("svg:title")
		.attr("class","tooltip")
		.style("fill","black")
		.text(function(el) { 
			switch($('#area_granularity_list').val()) {
			    case "borough_boundaries":
			    		return "Borough:\t"+el.properties.b+"\n" +
		    			   	   "Borough ID:\t"+el.properties.a;
			    case "postal_code":
			    		return "Zip Code:\t"+el.properties.p+"\n" +
			    			   "Postal Office:\t"+el.properties.a+"\n" +
			    			   "Borough:\t"+el.properties.b;
			    case "tracts":
			    		return "Tract:\t"+el.properties.a+"\n" +
			    			   "Tract ID:\t"+el.properties.g+"\n" +
			    			   "Borough:\t"+el.properties.c; 
		}
			
			
		});
	
	svg.selectAll("path.street")
		.on('mouseover', function(d){
		    d3.select(this).style({"stroke-width":'3'});
		})
		.on('mouseout', function(d){
		    d3.select(this).style({"stroke-width":'0.25'});
		})
		
		
	$('#table_area').bootstrapTable({
		icons:{
			  paginationSwitchDown: 'glyphicon-collapse-down icon-chevron-down',
			  paginationSwitchUp: 'glyphicon-collapse-up icon-chevron-up',
			  refresh: 'glyphicon-refresh icon-refresh',
			  toggle: 'glyphicon-list-alt icon-list-alt',
			  columns: 'glyphicon-th icon-th',
			  detailOpen: 'glyphicon-plus icon-plus',
			  detailClose: 'glyphicon-minus icon-minus'
			},
		showColumns:true,
		showToggle:true,
		clickToSelect:true,
		singleSelect:true,
		
		columns: [
			{checkbox:true},
			{field: '_id.id',
	        title: 'ID',
		    sortable:true,
		    visible:true,
		    align:"left"},
		    {field: '_id.name',
		        title: 'Name',
			    sortable:true,
			    visible:true,
			    align:"left"},
		    {field: '_id.area',
		        title: 'Size (Km<sup>2</sup>)',
			    sortable:true,
			    visible:true,
			    align:"right",
			    	formatter: function(el){return Number(Math.round(el+'e3')+'e-3').toFixed(3)}
			    },
		    {field: 'crash',
			        title: 'Crash',
				    sortable:true,
				    visible:true,
				    align:"right"},
		    {field: 'involved_vehicle',
		        title: 'Involved Vehicle',
			    sortable:true,
			    visible:true,
			    align:"right"},
		    {field: 'person_injured',
		        title: 'Person Injured',
			    sortable:true,
			    visible:true,
			    align:"right"},
		    {field: 'person_killed',
		        title: 'Person Killed',
			    sortable:true,
			    align:"right"},
		    {field: 'pedestrian_injured',
		        title: 'Pedestrian Injured',
			    sortable:true,
			    visible:false,
			    align:"right"},
		    {field: 'pedestrian_killed',
		        title: 'Pedestrian Killed',
			    sortable:true,
			    visible:false,
			    align:"right"},
		    {field: 'cyclist_injured',
		        title: 'Cyclist Injured',
			    sortable:true,
			    visible:false,
			    align:"right"},
		    {field: 'cyclist_killed',
		        title: 'Cyclist Killed',
			    sortable:true,
			    visible:false,
			    align:"right"},
			    
		    {field: 'motorist_injured',
		        title: 'Motorist Injured',
			    sortable:true,
			    visible:false,
			    align:"right"},
		    {field: 'motorist_killed',
		        title: 'Motorist Killed',
			    sortable:true,
			    visible:false,
			    align:"right"},
		],
	    pagination:true,
	    locale:'en-US',
	    striped:true,
	    search:true,
	    onCheck: function (item) {
	    		$(".subarea").css("opacity",0.05);
	    		$("#area_id_"+item._id.id).css("opacity",1);
	    },
	    onUncheck: function (item) {$(".subarea").css("opacity",1);}
	});
	
	$('#table_area').bootstrapTable('removeAll');
		
	$("#area_apply,#area_kpi_list").prop('disabled', false);
	$("#area_loader").slideUp();
	
	
svg.insert("path",":first-child")
	.datum(topojson.feature(area, area.objects.collection))
	.attr("d", path)
	.attr("class", "area")
	
}

function mapAreaCallback(data){
	$(".sliders_area").hide()
	$(".subarea").css("stroke",d3.hcl("#00cc00").darker(1))
	$(".subarea").css("fill","#00cc00")
	$(".subarea").css("opacity","1")

	$("#area_kpi_slider").slider("disable")

	data_area = data
	var kpi= $("#area_kpi_list").val()
	
	var min = 0;
	var max = d3.max(data, function(d) { return d[kpi]; })
	
	if(min == null){min = 0}
	if(max == null){max = min}
	
	$("#area_kpi_slider").slider('setAttribute', 'min', 0);
	$("#area_kpi_slider").slider('setAttribute', "max",max);
	$("#area_kpi_slider").slider('setValue', [min,max]);
	$("#area_kpi_slider_range").text($("#area_kpi_slider").slider("getValue"));
	
	if((min == max && max == 0) == false){
		updateColorMapArea(data, "#area_kpi_slider",  "#area_scale_list","#area_kpi_list")
	}	
	drawColorScale("#legend_area_map","#area_kpi_slider","#area_scale_list")
	$("#area_apply,#area_kpi_list,#area_scale_list").prop('disabled', false);
	$("#area_loader").slideUp();
	$("#area_kpi_slider").slider("enable")
	$(".sliders_area").show()
	
	$('#table_area').bootstrapTable('load',data);

}

function updateColorMapArea(data, selector_slider,  selector_scale, selector_kpi){
	var kpi= $(selector_kpi).val()
	var max=$(selector_slider).slider("getValue")[1]
	var color = getColorScale(selector_scale,max)
	$(".subarea").css("fill","#00cc00")
	$(".subarea").css("stroke",d3.hcl("#00cc00").darker(1))
	$.each(data, function(index, item){
		if(item[kpi]>0){
			$("#area_id_"+item._id.id).css("fill",color(item[kpi]))
			$("#area_id_"+item._id.id).css("stroke",d3.hcl(color(item[kpi])).darker(1))
		}
	})
}


/******/