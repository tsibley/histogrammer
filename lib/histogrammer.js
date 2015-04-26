// vim: set ts=2 sw=2 expandtab :

/* Utility functions */
var q = function(){
  if (arguments.length == 2)
    return arguments[0].querySelector(arguments[1]);
  else if (arguments.length == 1)
    return document.querySelector(arguments[0]);
  else
    throw "wrong parameters to $";
};

var unique = function(list) {
  var seen = {};
  return list.filter(function(_){
    return seen[_] ? false : seen[_] = true
  });
};


/* Stack management */
var stack = [];

var drillDown = function(values) {
  if (unique(values).length <= 1)
    return;
  stack.push(values);
  render(values);
};

var drillUp = function(to_idx) {
  if (stack.length <= 1)
    return;
  if (to_idx != null)
    stack.splice(to_idx + 1, Number.MAX_VALUE);
  else
    stack.pop()
  render(stack[stack.length - 1]);
};


/* Formatters */
var  formatCount = d3.format(",.0f");
var _formatValue = d3.format(",.2f");
var  formatValue = function(v){
  v = _formatValue(v);
  return v.replace(/\.0+$/, '');
};
var formatData = function(d){
  var range = [d3.min(d), d3.max(d)]
  return formatCount(d.length)
    + " value" + (d.length == 1 ? "" : "s")
    + " [" 
    + (unique(d).length == 1
        ? formatValue(d[0])
        : range.map(formatValue).join("–"))
    + "]";
};


/* Canvas setup */
var body = d3.select(".container.main"),
    breadcrumbs = body.append("ol").attr("class", "breadcrumb");

var margin = { top: 30, right: 30, bottom: 30, left: 60 },
    bodyWidth = body[0][0].offsetWidth - 30;
    width = bodyWidth - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = body.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


/* Rendering functions */
var renderStack = function(){
    var crumbs = breadcrumbs.selectAll('.stack')
        .data(stack);
    crumbs.enter().append("li")
        .attr("class", "stack")
        .append("a")
          .attr("href", "#")
          .text(function(d){ return formatData(d) })
          .on("click", function(d,i){
            d3.event.preventDefault();
            drillUp(i)
          });
    crumbs.exit().remove();
}

var render = function(values) {
    var range = [d3.min(values), d3.max(values)];

    var x = d3.scale.linear()
        .domain(range)
        .range([0, width]);

    var hist = d3.layout.histogram()
        .bins( Math.min(30, range[1] - range[0] + 1) );

    var data = hist(values);

    var y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.y })])
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    svg.selectAll('*').remove();

    var bar = svg.selectAll(".bar")
        .data(data)
      .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")" })
        .classed("clickable", function(d){ return unique(d).length > 1 })
        .on("click", function(d){ drillDown(d) })
        .attr("title", function(d){ return formatData(d, true) });

    bar.append("rect")
        .attr("x", 1)
        .attr("width", x(data[0].dx) - x(0))
        .attr("height", function(d) { return height - y(d.y) });

    bar.filter(function(d){ return d.length > 0 })
      .append("text")
        .attr("dy", ".75em")
        .attr("y", "-1em")
        .attr("x", x(data[0].x + (data[0].dx / 2)) - x(data[0].x))
        .attr("text-anchor", "middle")
        .text(function(d) { return formatCount(d.y) });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    renderStack();
};


/* Data loading and manipulation */
var values = function(values){
  if (typeof(values[0]) === "object") {
    return values.map(function(d){
      var l = Number(d.count);
      var a = Array(l);
      while (l--) a[l] = Number(d.value);
      return a;
    })
    .reduce(function(a,b){ return a.concat(b) });
  } else {
    return values;
  }
};


/* Register non-d3 event handlers */
Mousetrap.bind("esc", function(){ drillUp() });

q("#toggle-labels").addEventListener("click", function(e){
  q("body").classList.toggle("show-labels");
  this.classList.toggle("active");
});
