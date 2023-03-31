class ServiceName {
    constructor(_config,_dispatcher, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerHeight: _config.containerHeight || 500,
            containerWidth: _config.containerWidth || 140,
            margin: {top: 10, right: 20, bottom: 30, left: 170},
            toolTipPadding: _config.toolTipPadding || 15,
        }
        this.dispatcher = _dispatcher
        this.data = _data

        this.initVis();
    }

    initVis() {
        let vis = this;
        
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom

        vis.selection = []

        vis.chart = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth )
            .attr('height', vis.config.containerHeight)
            .append('g')
                .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
        
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width])
        vis.yScale = d3.scaleBand()
            .range([0, vis.height])
            .paddingInner(0.15)

        vis.xAxis = d3.axisBottom(vis.xScale)
        vis.yAxis = d3.axisLeft(vis.yScale)
        
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.height})`)
    
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis')        
    }

    updateVis() {
        let vis = this

        let otherCount = 0
        let shiftCount = 0

        vis.serviceNames = Array.from(d3.rollup(vis.data.filtered, d=> d.length, d => d.serviceName)).sort((a, b) => a[1] - b[1])

        vis.serviceNames.forEach(value => {
            if(value[1] < (vis.data.filtered.length / 100)){
                otherCount += value[1]
                shiftCount += 1
            }
        })

        for (let i = 0; i < shiftCount; i++){
            vis.serviceNames.shift()
        }

        if(otherCount > 0)
            vis.serviceNames.push(["Other", otherCount])

        vis.serviceNames.sort()

        vis.xValue = d => d[1]
        vis.yValue = d => d[0]


        vis.xScale.domain([0, d3.max(vis.serviceNames, d => vis.xValue(d))])
        vis.yScale.domain((vis.serviceNames.map(m => vis.yValue(m))))

        vis.chart.selectAll(".label")     
            .data(vis.serviceNames)
            .join("text")
                .attr("class","label")
                .attr("y", d => (vis.yScale(vis.yValue(d)) + (vis.yScale.bandwidth() / 2)))
                .transition()
                .attr("x", d => vis.xScale(vis.xValue(d)))
                .attr("dy", ".75em")
                .text(d => vis.xValue(d));

        vis.renderVis()
    }

    renderVis() {
        let vis = this

        vis.bars = vis.chart.selectAll('.bar')
            .data(vis.serviceNames)
            .join('rect')
                .attr('class', 'bar')
                .attr('fill', '#cb6543')
                .attr('y', d => vis.yScale(vis.yValue(d)))
                .attr('height', vis.yScale.bandwidth())
            .on('click', (event, d) => {
                let index = vis.selection.indexOf(d[0])
                if(index == -1){
                    vis.selection.push(d[0])
                    vis.dispatcher.call('filterServiceName', event, vis.selection);

                    vis.bars.attr('fill', d=> vis.selection.includes(d[0]) ? '#9e3715' : '#cb6543')
                }
                else{
                    vis.selection.splice(index, 1)
                    vis.dispatcher.call('filterServiceName', event, vis.selection);

                    vis.bars.attr('fill', d=> vis.selection.includes(d[0]) ? '#9e3715' : '#cb6543')
                }
            })

            vis.bars.transition()
            .attr('width', d => vis.xScale(vis.xValue(d)))
            .attr('x', 0)

                
        vis.xAxisG.call(vis.xAxis)
        vis.yAxisG.call(vis.yAxis)
    }
}