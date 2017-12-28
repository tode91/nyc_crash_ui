var kpi_list = []
var server_host="https://sheltered-peak-36566.herokuapp.com/"
	
	
var projection, zoom, drag ;

var colorRange = ["#ffff00", "#FFA500","#cc0000"];
var data_street;
var data_area;

var kpi_column_list=[]

$(document).ready(function(){
	  
	//postRequest("dashboardsParameters",{},dahboardParams)
	
	projection = d3.geo.mercator()
					.center([-73.90, 40.775])
					.scale(75000);
	  
	queue()
		.defer(d3.json, 'resources/nyc_area.min.topojson')
		.defer(d3.json, 'resources/nyc_boundaries.min.topojson')
		.defer(d3.json, 'resources/nyc_road_internal_name_not_null.min.topojson')
		.await(drawStreetMap);
	
	/*$('#area_granularity_list').on("change",function(){
		
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
	
	*/
	
	  // Fix for charts under tabs
  $('.box ul.nav a').on('shown.bs.tab', function () {
		alert("ss")
  });
  
  draw_sankey("#sankey_causes","/mocked_data/sankey.json")
  draw_sankey("#sankey_vehicle","/mocked_data/sankey4.json")
  //drawLineChart("#time_chart",{})
  testMultiline("#time_chart")

})

function formatKpi(str){
	return str.replace("_"," ").replace(/\b\w+/g,function(s){return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase()})
}


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
			.attr("class", "area");
	
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

// Sankey

function draw_sankey(selector,file){
	var width = $(selector).width(),
    height = $(selector).height();

	var svg = d3.select(selector); 

	var formatNumber = d3.format(",.0f"),
		format = function(d) { return formatNumber(d) + " TWh"; },
		color = d3.scaleOrdinal(d3.schemeCategory10);

	var sankey = d3.sankey()
		.nodeWidth(15)
		.nodePadding(10)
		.extent([[1, 1], [width - 1, height - 6]]);
	

	var link = svg.append("g")
		.attr("class", "links")
		.attr("fill", "none")
		.attr("stroke", "#000")
		.attr("stroke-opacity", 0.2)
	  .selectAll("path");

	var node = svg.append("g")
		.attr("class", "nodes")
		.attr("font-family", "sans-serif")
		.attr("font-size", 10)
	  .selectAll("g");

	d3.json(file, function(error, energy) {
	  if (error) throw error;

	  console.log(energy)
	  sankey(energy);

	  link = link
		.data(energy.links)
		.enter().append("path")
		  .attr("d", d3.sankeyLinkHorizontal())
		  .attr("stroke-width", function(d) { return Math.max(1, d.width); })
		  .attr("class", "link");

	  link.append("title")
		  .text(function(d) { return d.source.name + " → " + d.target.name + "\n" + format(d.value); });

	  node = node
		.data(energy.nodes)
		.enter().append("g");

	  node.append("rect")
		  .attr("x", function(d) { return d.x0; })
		  .attr("y", function(d) { return d.y0; })
		  .attr("height", function(d) { return d.y1 - d.y0; })
		  .attr("width", function(d) { return d.x1 - d.x0; })
		  .attr("fill", function(d) { return color(d.name.replace(/ .*/, "")); })
		  .attr("stroke", "#000");

	  node.append("text")
		  .attr("x", function(d) { return d.x0 - 6; })
		  .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
		  .attr("dy", "0.35em")
		  .attr("text-anchor", "end")
		  .text(function(d) { return d.name; })
		.filter(function(d) { return d.x0 < width / 2; })
		  .attr("x", function(d) { return d.x1 + 6; })
		  .attr("text-anchor", "start");

	  node.append("title")
		  .text(function(d) { return d.name + "\n" + format(d.value); });
	});
}

// Line chart

function drawLineChart(selector, data){

	d3.json("/mocked_data/mocked_data_time_chart.json", function(data) {
  		// Get the data again
		data.map(function(d) {
			date = new Date(d._id.year, d._id.month, d._id.day, d._id.hour, d._id.minute, 0, 0)
			d.date= date.getTime()/1000
			//d.close = +d.close;
		});	
		
		data.sort(function(x, y){
		   return d3.ascending(x.date, y.date);
		})
		console.log(data)

		var margin = {top: 20, right: 20, bottom: 30, left: 40},
		width = $(selector).width() - margin.left - margin.right,
		height = $(selector).height() - margin.top - margin.bottom;

		var x = d3.scale.linear()
			.domain(d3.extent(data, function(d) { return d.date; }))
			.range([0, width]);

		var y = d3.scale.linear()
			.domain([0, d3.max(data, function(d) { return d.crash; })])
			.range([height, 0]);
		
		var z = d3.scaleOrdinal(d3.schemeCategory10);
	
		var line = d3.line()
					.curve(d3.curveBasis)
					.x(function(d) { return x(d.date); })
					.y(function(d) { return y(d.temperature); });

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.tickSize(-height).tickFormat(d3.format(".3n"));

		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			.ticks(20)
			.tickSize(-width).tickFormat(d3.format(".3n"));

		var zoom = d3.behavior.zoom()
			.x(x)
			.y(y)
			.scaleExtent([1, 10])
			.center([width / 2, height / 2])
			.size([width, height])
			.on("zoom", zoomed);

		var svg = d3.select(selector)
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		  .append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.call(zoom);

		svg.append("rect")
			.attr("width", width)
			.attr("height", height);

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis);

		function zoomed() {
		    //svg.select(".x.axis").call(xAxis);
		    svg.select(".y.axis").call(yAxis);
		  
		  	svg.selectAll(".charts")
				.attr("transform", d3.event.transform);
			//d3.selectAll('.line').style("stroke-width", 2/d3.event.transform.k);
			svg.select(".x.axis").call(xAxis.scale(d3.event.transform.rescaleX(x)));
			svg.select(".y.axis").call(yAxis.scale(d3.event.transform.rescaleY(y)));
		}

		function coordinates(point) {
		  var scale = zoom.scale(), translate = zoom.translate();
		  return [(point[0] - translate[0]) / scale, (point[1] - translate[1]) / scale];
		}

		function point(coordinates) {
		  var scale = zoom.scale(), translate = zoom.translate();
		  return [coordinates[0] * scale + translate[0], coordinates[1] * scale + translate[1]];
		}
	
		// Define the line
		var valueline = d3.svg.line()
			.x(function(d) { return x(d.date); })
			.y(function(d) { return y(d.crash); });
        
			// Add the valueline path.
		svg.append("g")
			.attr("class", "charts")
			.append("path")
				.datum(data)
				.attr("class", "line")
			.attr("d", valueline(data));

		});	

}


function testMultiline(selector){

	d3.json("/mocked_data/mocked_data_time_chart.json", function(data) {
	
		data.map(function(d){
			d.date=new Date(d._id.date)
			delete d._id
		})
		
		data.sort(function(x, y){
		   return d3.ascending(x.date, y.date);
		})
		console.log(data)
		var legend_width=175

		var svg = d3.select(selector);

		var xExtent = d3.extent(data, function(d, i) { return d.date; });

		var yValues = [];

		data.forEach(function(d) {
		  for (key in d) {
			if (key !== 'date') {
			  yValues.push(d[key]);
			}
		  }	
		});

		var yMin = d3.min(yValues, function(d, i) { return d; });
		var yMax = d3.max(yValues, function(d, i) { return d; });

		var xOrigScale = d3.scaleTime()
		  .domain([ new Date(xExtent[0]), new Date(xExtent[1]) ])
		  .range([65,$(selector).width()-20-legend_width]);

		var xScale = xOrigScale.copy();

		var yScale = d3.scaleLinear()
		  .domain([yMin, yMax])
		  .range([560,0]);

		var yOrigScale = yScale.copy();

		var xAxis = d3.axisBottom(xScale).ticks(10);
		var yAxis = d3.axisLeft(yScale);
		
		svg.append("rect")
		  .attr("class", "overlay")
		  .attr("width", $(selector).width()-20-legend_width)
		  .attr("height", 560)
		  .on("mouseout", function() { 
			focus.style('display', 'none');
			
			svg.selectAll('.label_legend_value')
				  .transition()
				  .duration(100)
				  .text(""); 
		  })
		  .on("mousemove", mousemove)
		  .style('cursor', 'move')
		  .attr('clip-path', 'url(#clip)');


		var xAxisG = svg.append('g')
		  .attr('id', 'xAxisG')
		  .attr('transform', 'translate(0,560)')
		  .call(xAxis);

		var yAxisG = svg.append('g')
		  .attr('id', 'yAxisG')
		  .attr('transform', 'translate(65,0)')
		  .call(yAxis);

		var color = d3.scaleOrdinal(['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a'].reverse());

		var linesG = svg.append('g');
		
		var dotsG = svg.append('dot');
		
		var legend = svg.append('g')
		  .attr('id', 'legend')
		  .attr('transform', 'translate('+975+', 100)')

		var dateText = legend.append('text')
		  .attr('id', 'date-text')
		  .attr('class', 'legend-text')
		  .attr('x', 10)
		  .attr('y', 0);
		  
	    dateText.append("tspan")
			 .style("font-weight",  "bold")
			 .attr("class","label_legend_key")
			 .text("Date: ");

		var date_text_value=dateText.append("tspan")
		 	.attr("id","date_text")
		 	.attr("class","label_legend_value")
			.text("");

		var lines = {};
		var paths = {};
		var index = Object.keys(data[0]).length - 1;

		var keys= Object.keys(data[0]).sort(function(x,y){ return d3.descending(x, y);})
		console.log(keys)
		linesG.selectAll("circle").remove()
		for (k_idx in keys) {
			key = keys[k_idx];
		  if (key !== 'date') {

			var line = d3.line()
			  //.curve(d3.curveCatmullRomOpen)
			  .x(function(d) {
				return xScale(new Date(d.date));
			  })
			  .y(function(d) {
				return yScale(d[key]);
			  })

			lines[key] = line;
			
			path = linesG.append('path')
			  .attr('d', line(data))
			  .attr("class","line_"+key)
			  .attr('id', key)
			  .attr('fill', 'none')
			  .attr('stroke', function(d) { return color(key); })
			  //.attr('stroke-width', );

			var totalLength = path.node().getTotalLength();

			path
			  .attr('stroke-dasharray', totalLength + ' ' + totalLength)
			  .attr('stroke-dashoffset', totalLength)
			  .transition()
			  .duration(2000)
				.ease(d3.easeCubicInOut)
			  .attr('stroke-dashoffset', 0);

			paths[key] = path;
			
			 linesG.selectAll("g").data(data)
			  .enter().append("circle")
				.attr("r", 2.5)
				.attr("class","line_"+key)
				.attr("cx", function(d) { return xScale(new Date(d.date)); })
				.attr("cy", function(d) { return yScale(d[key]);})
				.attr('fill', function(d) { return color(key); })
				.attr('stroke', function(d) { return d3.rgb(color(key)).darker(1); })
				.attr('stroke-width', 0.5)



			legend.append('rect')
			  .attr('class', 'legend-text')
			  .attr('fill', color(key))
			  .attr("class","line_"+key)
			  .attr('x', function() {
				return 10;
			  })
			  .attr('height', 20)
			  .attr('width', 20)
			  .attr('y', function() {
				return 20 * index + 5*index;
			  })
			   .on("click", function(){
					// Determine if current line is visible 
					var cl = $(this).attr("class")
					var op = $("circle."+cl).css("opacity");
					var op_switch=1
					if(op==1) op_switch=0
					console.log($(this).attr("class"),op,op_switch)
					d3.selectAll("circle."+cl+","+"path."+cl)
						.transition().duration(100) 
						.style("opacity", op_switch)
						.style("fill-opacity", op_switch)
						.style("stroke-opacity", op_switch);
				}).text("Click to hide/display this serie")

			var kpi_text = legend.append('text')
			  .attr('class', 'legend-text')
			  .attr('fill', 'black')
			  .attr('height', 10)
			  .attr('x', function() {
				return 40;
			  })
			  .attr('y', function() {
					return 15 + 10*index + 15*index;
			   });
			
			
			kpi_text.append("tspan")
			 .style("font-weight",  "bold")
			 .attr("class","label_legend_key")
			 .text(formatKpi(key)+": ");
			 
			kpi_text.append("tspan")
			 .attr('id', 'text' + key)
			 .attr("class","label_legend_value")
			 .text("");

			index--;
		  }
		}
	
			

		var clipPath = svg.append('clipPath')
			.attr('id', 'clip')
			.append('rect')
			.attr('x', 65)
			.attr('y', 0)
			.attr('height', 560)
			.attr('width', $(selector).width()-65-20-legend_width);

		var focus = svg.append('g')
		  .attr('class', 'focus')
		  .style('display', 'none');

		focus.append('line')
		  .attr('id', 'dotted-line')
		  .attr('x1', 0)
		  .attr('y1', 0)
		  .attr('x2', 0)
		  .attr('y2', 560)
		  .attr('stroke', '#082952')
		  .attr('stroke-width', 1)
		  .attr('stroke-dasharray', '1, 2');

		var zoom = d3.zoom()
			.scaleExtent([1, 25])
			.on('zoom', zoomed);

		svg.call(zoom);

		function zoomed() {

		  xScale = d3.event.transform.rescaleX(xOrigScale);

		  xAxisG.call(xAxis.scale(d3.event.transform.rescaleX(xOrigScale)));
		  
		  yScale = d3.event.transform.rescaleY(yOrigScale);

		  yAxisG.call(yAxis.scale(d3.event.transform.rescaleY(yOrigScale)));

			linesG.selectAll("circle").remove()
		  for (key in data[0]) {
			  if (key !== 'date') {

				line = lines[key];
				path = paths[key];

				totalLength = path.node().getTotalLength();

				path
				  .attr('stroke-dasharray', totalLength + ' ' + totalLength)
				  .attr('stroke-dashoffset', totalLength)
				  .attr('stroke-dashoffset', 0);

				path.attr('d', line(data));
				path.attr('clip-path', 'url(#clip)');
				
				 
			 linesG.selectAll("g").data(data)
			  .enter().append("circle")
				.attr("r", 2.5).attr("cx", function(d) { return xScale(new Date(d.date)); })
				.attr("cy", function(d) { return yScale(d[key]);})
				.attr('fill', function(d) { return color(key); })
				.attr('stroke', function(d) { return d3.rgb(color(key)).darker(1); })
				.attr('stroke-width', 0.5)
				.attr("class","line_"+key)
				.attr('clip-path', 'url(#clip)');

			  }
			}

		}

		var bisectDate = d3.bisector(function(d) { return new Date(d.date); }).left;

		function mousemove() {
		  var x = d3.mouse(this)[0];

		  var x0 = xScale.invert(d3.mouse(this)[0]),
			i = bisectDate(data, x0, 1),
			d0 = data[i - 1],
			d1 = data[i],
			d = x0 - d0.date > d1.date - x0 ? d1 : d0;

		  focus.style('display', 'block');
		  date_text_value.style('display', 'block');
		  legend
			.transition()
			.duration(90)
			.style('opacity', '1');

		  focus.attr("transform", "translate(" + xScale( new Date(d.date)) + ",0)");

		  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		  var weekday = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
		  var date = new Date(d.date);
		  date = weekday[date.getDay()].substring(0, 3) + ', ' + date.getDate() + ' ' + monthNames[date.getMonth()].substring(0, 3)  + ' ' + date.getFullYear();

		  date_text_value.text(date);
		  for (key in data[0]) {
			  if (key !== 'date') {
				svg.select('#text' + key)
				  .text(Number(d[key]).toLocaleString());
			}
		  }
		}
		
		// Add axis labels
		
		svg.append("text")             
      		.attr("transform","translate(" + (($(selector).width()-65-20-legend_width)) + " ," + (600) + ")")
      		.attr("class", "label_axis")
      		.text("Date");
      		
      	  svg.append("text")
			  .attr("transform", "rotate(-90)")
			  .attr("y", 0)
			  .attr("x",-50)
			  .attr("dy", "1em")
      		  .attr("class", "label_axis")
			  .text("Value");  
	})
}