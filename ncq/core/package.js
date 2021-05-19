/**
 * Object holding package inforation.
 */

class Package{
    constructor(info, id){
        //identifier
        this.id = id;

        this.name = info["name"];
        this.description = info["description"];
        this.keywords = info["keywords"];
        
        //features
        this.hasRunExample = !!info["hasRunExample"]; //100 User
        this.hasReadme = true; //prefiltered //100 Both
        this.hasLicense = !!info["license"]; //85 Both
        this.hasInstallExample = !!info["hasInstallExample"]; //82 Both
        //this.hasTestDirectory = true; //82 Both
        this.lastUpdate = info["timeModified"] ? Date.parse(info["timeModified"]) : false; //76 //Both
        this.numberOfCodeBlocks = info["numberOfCodeBlocks"]; //73 User
        this.hasRepoUrl = !!info["repositoryURL"]; //73 Both
        this.snippetCount = info["snippets"].length //55
        this.linesInReadme = info["linesInReadme"]; //52

        this.rankValue = undefined;
    }

    /**
     * Calculate a rank value for packages. For now let's just use stars.
     */
    rank(){
        if(this.rankValue){
            return this.rankValue;
        }
        this.rankValue = 0;

        if(this.hasRunExample) this.rankValue += 100;
        if(this.hasLicense) this.rankValue += 85;
        if(this.hasInstallExample) this.rankValue += 82;
        if(this.hasRepoUrl) this.rankValue += 73;
        if(this.lastUpdate){
            var value = 76;
            var min = 1263254400000 //npm start date, get min in dataset
            var max = 1621433376745-min; //Data.now(); with an updating database we would use current time
            var p = (this.lastUpdate-min)/max * value;
            this.rankValue+=p;
        }
        return this.rankValue;
    }

    /**
     * Package sort function, use as comparator argument to Array.sort() etc.
     * Sorts in descending order.
     */
    static sort(a, b){
        //calculate rank
        var rankA = a.rank();
        var rankB = b.rank();

        //if a is less than b
        if(rankA < rankB){
            return 1;
        }

        //if a is more than b
        if(rankA > rankB){
            return -1;
        }

        //if equal
        if(a.lastUpdate || b.lastUpdate){
            if(a.lastUpdate < b.lastUpdate) return 1;
            if(a.lastUpdate > b.lastUpdate) return -1;
        }

        return 0;

        
    }
}

module.exports = Package;