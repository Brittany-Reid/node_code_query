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
        this.hasTestDirectory = info["hasTestDirectory"] ? JSON.parse(info["hasTestDirectory"]) : false; //82 Both
        this.lastUpdate = info["timeModified"] ? Date.parse(info["timeModified"]) : false; //76 //Both
        this.numberOfCodeBlocks = info["numberOfCodeBlocks"]; //73 User
        this.hasRepoUrl = !!info["repositoryUrl"]; //73 Both
        this.snippetCount = info["snippets"] ? info["snippets"].length : 0; //55
        this.linesInReadme = info["linesInReadme"] ? parseInt(info["linesInReadme"]) : 0; //52
        this.stars = info["stars"] ? parseInt(info["stars"]) : 0;
        this.ableToBuildPrediction = info["ableToBuild"];
        // this.fork = JSON.parse(info["fork"]);
        // this.forks = parseInt(info["forks"]);
        // this.watchers = parseInt(info["watchers"]);

        this.rankValue = undefined;
    }

    /**
     * Calculate a rank value for packages. For now let's just use stars.
     */
    rank(){
        if(this.rankValue){
            return this.rankValue;
        }
        this.rankValue = this.ableToBuildPrediction;
        return this.rankValue;
    }

    /**
     * Package sort function, use as comparator argument to Array.sort().
     * Sorts in descending order.
     */
    static sort(a, b){

        //packages with less than 1 star are always below
        if(a.stars > 0 && b.stars <= 0) return -1;
        if(a.stars <= 0 && b.stars > 0) return 1;

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

        return 0;
    }
}

module.exports = Package;