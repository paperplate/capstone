/* global d3 */
function MakeAgeBars(facts, mycolours, renderAll) {
    var chart = this;
    var ages = [];
    var margin = {
        top: 60,
        right: 50,
        bottom: 60,
        left: 90
    };
    chart.ageDim = facts.dimension(function (d) {
        if (ages.indexOf(d["AgeGroup"]) === -1) {
            ages.push(d["AgeGroup"]);
        }
        return d["Agegroup"];
    });
    var ageGroup = chart.ageDim.group().reduce(
        function (p, v) {
            ++p.total;
            if (v.Dead === true) {
                if (v.Gender === "M") {
                    ++p.deadmale;
                }
                else {
                    ++p.deadfemale;
                }
                ++p.dead;
            }
            else {
                ++p.living;
                if (v.Gender === "M") {
                    ++p.livmale;
                }
                else {
                    ++p.livfemale;
                }
            }
            return p;
        },
        function (p, v) {
            --p.total;
            if (v.Dead === true) {
                if (v.Gender === "M") {
                    --p.deadmale;
                }
                else {
                    --p.deadfemale;
                }
                --p.dead;
            }
            else {
                --p.living;
                if (v.Gender === "M") {
                    --p.livmale;
                }
                else {
                    --p.livfemale;
                }
            }
            return p;
        },
        function () {
            return {
                total: 0,
                livmale: 0,
                livfemale: 0,
                deadmale: 0,
                deadfemale: 0,
                living: 0,
                dead: 0
            };
        }
    );

    function stackMax(serie) {
        return d3.max(serie, function (d) {
            return d.data.total;
        });
    }

    function stackOffsetDiverging(series, order) {
        if (!((n = series.length) > 1)) {
            return;
        }
        for (var i, j = 0, d, dy, yp, yn, n, m = series[order[0]].length; j < m; ++j) {
            for (yp = yn = 0, i = 0; i < n; ++i) {
                if ((dy = (d = series[order[i]][j])[1] - d[0]) >= 0) {
                    d[0] = yp, d[1] = yp += dy;
                }
                else if (dy < 0) {
                    d[1] = yn, d[0] = yn += dy;
                }
                else {
                    d[0] = yp;
                }
            }
        }
    }

    function makeStack(dat) {
        var newData = [];
        dat.forEach(function (d) {
            var tempObj = {};
            tempObj["age"] = d.key;
            tempObj["lived"] = -d.value.living;
            tempObj["livmale"] = -d.value.livmale;
            tempObj["livfemale"] = -d.value.livfemale;
            tempObj["died"] = d.value.dead;
            tempObj["deadmale"] = d.value.deadmale;
            tempObj["deadfemale"] = d.value.deadfemale;
            tempObj["total"] = d.value.total;
            newData.push(tempObj);
            ages.push(d.key);
        });
        var tmpstack = d3.stack()
            .keys(["lived", "died"])
            .offset(stackOffsetDiverging)
            (newData);
        return tmpstack;
    }

    var stackgendersvg = d3.select("#stacked-bars-age").append("svg")
        .attr("width", 400)
        .attr("height", 250);
    var stackgenderg = stackgendersvg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    stackgendersvg.append("text")
        .attr("transform",
            "translate(" + (+stackgendersvg.attr("width") / 1.25) + " ," + 20 + ")")
        .style("text-anchor", "middle")
        .text("Lived");
    stackgendersvg.append("text")
        .attr("transform",
            "translate(" + (+stackgendersvg.attr("width") / 3) + " ," + 20 + ")")
        .style("text-anchor", "middle")
        .text("Died");
    stackgendersvg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 25)
        .attr("x", 0 - (+stackgendersvg.attr("height") / 2) + 30)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Age");

    var width = +stackgendersvg.attr("width") - margin.left - margin.right,
        height = +stackgendersvg.attr("height") - margin.top - margin.bottom;
    var y = d3.scaleBand().rangeRound([0, height]).padding(0.1),
        x = d3.scaleLinear().rangeRound([0, width]),
        colour = d3.scaleOrdinal(mycolours);
    var xAxis = d3.axisTop().scale(x)
        .ticks(7, "d")
        .tickFormat(Math.abs);
    var yAxis = d3.axisLeft().scale(y);

    // stack cant accept nested objects, need to modify data
    // https://stackoverflow.com/questions/42039506/d3-stack-vs-nested-objects
    var stack = makeStack(ageGroup.top(Infinity));
    x.domain([-d3.max(stack, stackMax), d3.max(stack, stackMax)]).clamp(true).nice();
    y.domain(["10-18",
        "19-29",
        "30-39",
        "40-49",
        "50-59",
        "60-69",
        "70-79"
    ].reverse());

    var serie = stackgenderg.selectAll(".serie")
        .data(stack)
        .enter().append("g")
        .attr("class", "serie")
        .attr("fill", function (d) {
            return colour(d.key);
        });

    var rects = serie.selectAll("rect")
        .data(function (d) {
            return d;
        })
        .enter().append("rect")
        .attr("class", "bar agegroup");
    rects.attr("y", function (d) {
            return y(d.data.age);
        })
        .attr("x", function (d) {
            return x(d[0]);
        })
        .attr("width", function (d) {
            return x(d[1]) - x(d[0]);
        })
        .attr("height", y.bandwidth());

    chart.selectedage = [];
    rects.on("click", function (d, i) {
        //add/remove agegroup from list
        var temp = chart.selectedage.indexOf(d.data.age);
        if (temp === -1) {
            chart.selectedage.push(d.data.age);
        }
        else {
            chart.selectedage.splice(temp, 1);
        } //remove agegroup from list
        d3.selectAll(".agegroup").each(function (d) {
            if (chart.selectedage.indexOf(d.data.age) > -1) {
                //d3.select(this).attr("fill", "brown");
            }
            else {
                d3.select(this).attr("fill", "brown");
            }
        });
        chart.ageDim.filterFunction(function (d) {
            return chart.selectedage.indexOf(d) > -1;
        });
        renderAll(facts);
    });

    //axes
    stackgenderg.append("g")
        .attr("class", "axis axis--x")
        .call(xAxis);
    stackgenderg.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);

    var t = function (obj, choice) {
        obj.transition().duration(500)
            .attr("x", function (d) {
                if (d[0] === 0) {
                    return x(d[0]);
                }
                else if (choice !== null) {
                    if (choice[0] === "m" && choice.length === 1) {
                        return 130 - (x(d.data.died) - x(d.data.deadmale));
                    }
                    else if (choice[0] === "f" && choice.length === 1) {
                        return 130 - (x(d.data.died) - x(d.data.deadfemale));
                    }
                }
                return 130 - (x(d[1]) - x(d[0]));
            })
            .attr("width", function (d) {
                if (choice !== null) {
                    if (choice[0] === "m" && choice.length === 1) {
                        return x(d.data.died) - x(d.data.deadmale);
                    }
                    else if (choice[0] === "f" && choice.length === 1) {
                        return x(d.data.died) - x(d.data.deadfemale);
                    }
                }
                return x(d[1]) - x(d[0]);
            });
        return obj;
    };

    chart.update = function () {
        var stack = makeStack(ageGroup.top(Infinity));
        serie.data(stack);
        rects.data(function (d) {
                return d;
            })
            .attr("class", function (d) {
                return (chart.selectedage.indexOf(d.data.age) > -1) ? "bar agegroup selected" : "bar agegroup";
            })
            .transition(t(rects, null));
    };

    chart.updatecheck = function () {
        var choices = [];
        d3.selectAll(".myCheckbox2").each(function (d) {
            var cb = d3.select(this);
            if (cb.property("checked")) {
                choices.push(cb.property("value"));
            }
        });
        rects.transition(t(rects, choices));
    };
    return chart;
}