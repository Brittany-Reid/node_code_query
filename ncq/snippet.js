/**
 * Snippet object, with fields
 */

class Snippet {
  constructor(code, id, packageName, order, packageInfo) {
    //snippet string
    this.code = code;
    //id code
    this.id = id;
    //package name snippet belongs to
    this.packageName = packageName;
    //order in readme
    this.order = order;
    //package object this snippet belongs to
    this.packageInfo = packageInfo;

    this.rankValue = undefined;
    this.errors = undefined;
  }

  /**
   * Calculate a rank value for snippet. For now let's just use stars.
   */
  rank() {
    if(!this.rankValue){
        if(this.packageInfo){
            this.rankValue = this.packageInfo.stars;
        }
    }

    return this.rankValue;
  }

  /**
     * Snuppet sort function, use as comparator argument to Array.sort() etc.
     * Sorts in descending order.
     */
    static sort(a, b){
        //calculate rank
        var rankA = a.rank();
        var rankB = b.rank();

        //rank undefined below defined
        if(!rankA && rankB){
            return 1;
        }
        if(rankA && !rankB){
            return -1;
        }

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

module.exports = Snippet;
