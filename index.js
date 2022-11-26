
function clearPlots() {
    let plots = document.getElementsByClassName('plot');
    for (let i = 0; i < plots.length; i++) {
        let item = plots[i];  
        item.innerHTML = '';
    }
}

let clickedBin;
let clickedColor;
let currentVariable = "BPM";

document.addEventListener("DOMContentLoaded", async () => {

    async function drawTopPlots(){
        clearPlots();
        console.log(currentVariable);
        let res = await axios.get(`http://127.0.0.1:5000/lab5/histogramdata?var=${currentVariable}`);
        let histogram_data = res.data
        createHistogram('histogram', Object.values(histogram_data[currentVariable]), currentVariable);

        //lab 4 stuff
        res = await axios.get("http://127.0.0.1:5000/lab5/parallelaxis");
        createParallelPlot("parallel-coordinates", res.data)

        res = await axios.get("http://127.0.0.1:5000/lab5/pca");
        let pcaData = res.data;
    }

    drawTopPlots();
    let res = await axios.get("http://127.0.0.1:5000/lab5/genre-frequency?year=2010");
    createPieChart('piechart', res.data, 2010,  "Popularity", "Title");
    
    res = await axios.get("http://127.0.0.1:5000/lab5/genre-frequency?year=all&filter=2010");
    let genreData = res.data;
    let columns = genreData[11]
    genreData = genreData.slice(0,11)
    genreData.columns = columns

    createAreaChart('areachart', genreData, '2010')

    document.getElementById('variable').addEventListener("change", async function(event) {
        clearPlots();
        currentVariable = event.target.value;
        drawTopPlots();
        //examplePieChart()
    });
});

let changeColor = function(d){
    clickedBin = d.target.__data__;
    let randomColor = '#' + Math.random().toString(16).substr(-6);
    clickedColor = randomColor;
    this.style = `fill: ${clickedColor};`


    let parallelPlotLines = d3.select(`#parallel-coordinates`)
        .selectAll("path")
        ._groups[0]
    for(let i = 0; i < parallelPlotLines.length;i++){
        let line = parallelPlotLines[i];
        let lineData = line.__data__
        for(let j = 0; j < clickedBin.length;j++){
            if(lineData && (lineData[currentVariable]) == clickedBin[j]){
                line.style = `fill: none; stroke: ${clickedColor}; opacity: 0.5;`
            }
        }
    }
}

let resetColor = function(d){
    clickedColor = 'green';
    this.style = `fill: ${clickedColor};`
    let parallelPlotLines = d3.select(`#parallel-coordinates`)
        .selectAll("path")
        ._groups[0]

    let bins = d3.select(`#histogram`)
        .selectAll("rect")
        .style("fill", "green")
    for(let i = 0; i < parallelPlotLines.length;i++){
        let line = parallelPlotLines[i];
        line.style = `fill: none; stroke: ${clickedColor}; opacity: 0.5;`
    }
}

function createHistogram(div, data, var1){
    let numVariables = 10;

    let margin = {top: 50, right: 20, bottom: 50, left: 50},
        width = 500 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    let svg = d3.select(`#${div}`)
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .on("dblclick", resetColor)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    let x = d3.scaleLinear()
            .domain(ranges[var1])
            .range([ 0, width ])
           

    let titles = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
         

    let histogram = d3.histogram()
    .value(function(d) { return d; })   
    .domain(x.domain())  
    .thresholds(x.ticks(20)); 


    let bins = histogram(data);

    let y = d3.scaleLinear()
    .range([height, 0]);
    y.domain([0, d3.max(bins, function(d) { return d.length; })]);  
    svg.append("g")
    .call(d3.axisLeft(y));


    svg.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
        .attr("height", function(d) { return height - y(d.length); })
        .style("fill", "green")
        .on("click", changeColor)

    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 5 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("fill", "#c3c3c8")
        .text("Song Features Histogram");

    let yAxis = svg.append("text")
        .attr("text-anchor", "middle")  
        .attr("transform", `translate(${-10-(margin.left/2)},${(height/2)})rotate(-90)`)
        .style("font-size", "16px")
        .style("fill", "#c3c3c8") 
        .text("Frequency");

    let xAxis = svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", height + margin.top - 15)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px")
        .style("fill", "#c3c3c8") 
        .text(var1);

}

const ranges = {
    "Popularity": [0,100],
    "BPM": [0,200],
    "Energy": [0,100],
    "Danceability": [0,100],
    "Liveness": [0,80],
    "Valence": [0,100],
    "Duration": [0,450],
    "Acousticness": [0,100],
    "Speechiness": [0,50],
    "Loudness": [-20,0]
}

function createParallelPlot(div, dimensions){
    // set the dimensions and margins of the graph
    let margin = {top: 50, right: 20, bottom: 50, left: 50},
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    let svg = d3.select(`#${div}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", -10 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("fill", "#c3c3c8")
        .text("Features Parrallel Coordinates Plot");

    d3.csv("spotifiy2010-2021.csv").then( function(data) {

        let y = {}
        for (let i = 0; i < dimensions.length;i++) {
            name = dimensions[i]
            y[name] = d3.scaleLinear()
            .domain( d3.extent(data, function(d) { return +d[name]; }) )
            .range([height, 0])
        }

        let x = d3.scalePoint()
            .range([0, width])
            .padding(1)
            .domain(dimensions);

        function path(d) {
            return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
        }

        // Draw the lines
        let lines = svg
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d",  path)
            .style("fill", "none")
            .style("stroke", "green")
            .style("opacity", 0.5)

        let axis = svg.selectAll("axis")
            .data(dimensions).enter()
            
        let g = axis.append("g")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
            .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
            .call( d3.brushY()                     
                .extent( [ [-15,-15], [15,height] ] )
                .on("start brush", hideLines) 
            )
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function(d) { return d; })
            .style("fill", "#c3c3c8")
        
        function hideLines(event, p){
            let selection = event.selection;
            lines.style("display", function(d){
                let lineDimensions = [x(p), y[p](d[p])]
                if(selection[0] == selection[1]) return null
                if(lineDimensions[1] < selection[0] || lineDimensions[1] > selection[1]){
                    return "none";
                }
                return null;
            })
        }
    })
}


function createPieChart(div, data, year, var1, var2){
    console.log(data)
    //how many variables to show
    let newData = data;
    let var1Array = {};
    
    let width = 550,
        height = 375,
        radius = Math.min(width, height) / 2.5,

    svg = d3.select(`#${div}`)
    .append("svg")
        .attr("width", width)
        .attr("height", height)
    .append("g")
        .attr("transform",
            "translate(" + width / 2 + "," + height / 2 + ")");

    let color = d3.scaleOrdinal(['darkgreen','#99de31','#32a83c','#d8de2c', '#32a885']);

    // Generate the pie
    let pie = d3.pie()
    // Generate the arcs
    let arc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius);

    let title = svg.append("text")
        .attr("x", 0)             
        .attr("y", -10 - (radius))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px")
        .style("fill", "#c3c3c8") 
        .text(`Top Genres of ${year}`);

    let labels = "";
    let legend = "";
    let highlight = function(e, d){
        let genre = Object.keys(var1Array).find(key => var1Array[key] ===d.value).replace(/[()',]/g, "").replaceAll(" ", "-")
        console.log(genre)
        d3.selectAll(".myArea").style("opacity", .1)
        d3.select("."+CSS.escape(genre)).style("opacity", 1)
    }

    let noHighlight = function(d){
        d3.selectAll(".myArea").style("opacity", 1)
    }

    updateChart()

    document.getElementById('years').addEventListener("change", async function(event) {
        year = event.target.value;
        let res = await axios.get(`http://127.0.0.1:5000/lab5/genre-frequency?year=${year}`);
        newData = res.data;
        updateChart();

        document.getElementById("areachart").innerHTML = "";
        year = event.target.value;
        res = await axios.get(`http://127.0.0.1:5000/lab5/genre-frequency?year=all&filter=${year}`);
        let genreData = res.data;
        let columns = genreData[11]
        genreData = genreData.slice(0,11)
        genreData.columns = columns
        console.log(genreData)
        createAreaChart('areachart', genreData, year)
    });


    function updateChart(){
        var1Array = {};
        let genres = {};

        let total = 0;
        for( let i =0;i < newData.length;i++){
            total += parseInt(newData[i][var1])
        }

        for (const [key, value] of Object.entries(newData)) {
            total += parseInt(value)
        }

        let percentages = {}
        //store percentages

        for (const [key, value] of Object.entries(newData)) {
            let k = parseInt(value) + Math.random()/1000;
            var1Array[key] = k
            percentages[k] = Math.round((value/total) * 100);
        }

        let path = svg.selectAll("path")
            .data(pie(Object.values(var1Array)));

        path
            .join('path')
            .attr('fill', function(d, i){ return(color(i)) })
            .attr('d', arc)
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)
            
        if(labels) labels.remove()
        labels = svg.selectAll("labels")
            .data(pie(Object.values(var1Array)))
            .enter().append("g")
            .attr("class", "labels")
        
        labels
            .append('text')
            .text(function(d, i){ 
                return percentages[d.data] + "%" } )
            .attr("transform", function(d) { 
                return "translate(" + arc.centroid(d) + ")";  
            })
            .style("text-anchor", "middle")
            .style("font-size", 10)

        if(legend) legend.remove()
        legend = svg.selectAll(".legend")
            .data(pie(Object.values(var1Array)))
            .enter().append("g")
            .attr("transform", function(d,i){
                return "translate(" + (width/3 - 35) + "," + (i*20 - height/2 + 30 ) + ")"; 
              })
            .attr("class", "legend");

        legend.append("rect") 
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", function(d, i) {
              return color(i);
            });
            

        legend.append("text") // add the text
            .text(function(d){
              let genre = Object.keys(var1Array).find(key => var1Array[key] === d.data)
              return genre.replace(/[()',]/g, "")
            })
            .style("font-size", 15)
            .style("fill", "#c3c3c8")
            .attr("y", 12)
            .attr("x", 18);

        title
            .text(`Top Genres of ${year}`);
    }
}

function trimByYear(year, data, size){
    //trim data
    let yearId = (year - 2010)*50;
    return data.slice(yearId, yearId+size)
}

function createAreaChart(div, data, year, genre){

    let margin = {top: 60, right: 375, bottom: 50, left: 50},
    width = 850 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    let svg = d3.select(`#${div}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    let keys = data.columns.slice(1)

    //same color pallete as pie chart
    let color = d3.scaleOrdinal()
        .domain(keys)
        .range(['darkgreen','#99de31','#32a83c','#d8de2c', '#32a885'].reverse());

    //stack the data
    let stackedData = d3.stack()
        .keys(keys)
        (data)

    //x axis
    let x = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d.year; }))
        .range([ 0, width ]);
    let xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(5))

    //x label
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height+35 )
        .style("fill", "#c3c3c8")
        .text("Time (year)");

    //y label
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", 0)
        .attr("y", -10 )
        .style("fill", "#c3c3c8")
        .text(`Top 5 Genres across 2010-2020`)
        .attr("text-anchor", "start")

    //y axis
    let y = d3.scaleLinear()
        .domain([0, 80])
        .range([ height, 0 ]);
        svg.append("g")
        .call(d3.axisLeft(y).ticks(4))

    let clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);

    //brushing
    let brush = d3.brushX()                 
        .extent( [ [0,0], [width,height] ] )
        .on("end", updateChart) 

    let areaChart = svg.append('g')
        .attr("clip-path", "url(#clip)")

    let area = d3.area()
        .x(function(d) { return x(d.data.year); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })

    areaChart
        .selectAll("mylayers")
        .data(stackedData)
        .enter()
        .append("path")
        .attr("class", function(d) { return "myArea " + d.key })
        .style("fill", function(d) { return color(d.key); })
        .attr("d", area)

    //brushing
    areaChart
        .append("g")
        .attr("class", "brush")
        .call(brush);

    let idleTimeout
    function idled() { idleTimeout = null; }

    function updateChart(event) {
        let extent = event.selection
        if(!extent){
        if (!idleTimeout) return idleTimeout = setTimeout(idled, 300); 
            x.domain(d3.extent(data, function(d) { return d.year; }))
        }else{
            x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
            areaChart.select(".brush").call(brush.move, null)
        }

        xAxis.transition().duration(1000).call(d3.axisBottom(x).ticks(5))
        areaChart
            .selectAll("path")
            .transition().duration(1000)
            .attr("d", area)
    }

    let highlight = function(e, d){
        d3.selectAll(".myArea").style("opacity", .1)
        d3.select("."+CSS.escape(d)).style("opacity", 1)
    }

    let noHighlight = function(d){
        d3.selectAll(".myArea").style("opacity", 1)
    }

    // area chart legend
    let size = 15
    svg.selectAll("myrect")
        .data(keys)
        .enter()
        .append("rect")
            .attr("x", 400)
            .attr("y", function(d,i){ return 10 + i*(size+5)}) 
            .attr("width", size)
            .attr("height", size)
            .style("fill", function(d){ return color(d)})
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)

    svg.selectAll("mylabels")
        .data(keys)
        .enter()
        .append("text")
            .attr("x", 400 + size*1.2)
            .attr("y", function(d,i){ return 10 + i*(size+5) + (size/2)}) 
            .style("fill", function(d){ return color(d)})
            .text(function(d){ return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)
}