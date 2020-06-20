class Xwiper {
    constructor(element, sense) {
        this.element = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.touchMovedX = 0;
        this.touchMovedY = 0;
        this.sensitive = sense;
        this.onSwipeLeftAgent = null;
        this.onSwipeRightAgent = null;
        this.onSwipeUpAgent = null;
        this.onSwipeDownAgent = null;
        this.onTapAgent = null;
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onPointerStart = this.onPointerStart.bind(this);
        this.onPointerMoved = this.onPointerMoved.bind(this);
        this.onPointerEnd = this.onPointerEnd.bind(this);
        this.onSwipeLeft = this.onSwipeLeft.bind(this);
        this.onSwipeRight = this.onSwipeRight.bind(this);
        this.onSwipeUp = this.onSwipeUp.bind(this);
        this.onSwipeDown = this.onSwipeDown.bind(this);
        this.onTap = this.onTap.bind(this);
        this.destroy = this.destroy.bind(this);
        this.handleGesture = this.handleGesture.bind(this);

        this.element = document.querySelector(element);
		if (window.PointerEvent) {
			this.element.addEventListener( 'pointerdown', this.onPointerStart,false);

			this.element.addEventListener( 'pointermove', this.onPointerMoved,false);
				
			this.element.addEventListener( 'pointercancel', this.onPointerEnd,false);
		} else {
			this.element.addEventListener('touchstart', this.onTouchStart ,false);
			this.element.addEventListener('touchend', this.onTouchEnd, false);	
		}
    }

    onTouchStart(event) {
        this.touchStartX = event.changedTouches[0].screenX;
        this.touchStartY = event.changedTouches[0].screenY;
    }

    onTouchEnd(event) {
        this.touchEndX = event.changedTouches[0].screenX;
        this.touchEndY = event.changedTouches[0].screenY;
        this.handleGesture();
    }

    onPointerStart(event) {
		switch ( event.pointerType ) {
			case 'mouse':
				//add code
			break;

			case 'touch':
				this.touchStartX = event.screenX;
				this.touchStartY = event.screenY;
			break;
			case 'pen':
				//add code
			break;
			default:
				//add code
			break;
			}
    }

    onPointerMoved(event) {
		switch ( event.pointerType ) {
			case 'mouse':
				//add code
			break;
			case 'touch':
				this.touchMovedX = event.screenX;
				this.touchMovedY = event.screenY;
			break;
			case 'pen':
				//add code
			break;
			default:
				//add code
			break;
		}
    }
    onPointerEnd(event) {
		switch ( event.pointerType ) {
			case 'mouse':
				//add code
			break;

			case 'touch':
				this.touchEndX = this.touchMovedX;
				this.touchEndY = this.touchMovedY;
			break;

			case 'pen':
				//add code
			break;

			default:
				//add code
			break;
		}
        this.handleGesture();
    }

    onSwipeLeft(func) {
        this.onSwipeLeftAgent = func;
    }
    onSwipeRight(func) {
        this.onSwipeRightAgent = func;
    }
    onSwipeUp(func) {
        this.onSwipeUpAgent = func;
    }
    onSwipeDown(func) {
        this.onSwipeDownAgent = func;
    }
    onTap(func) {
        this.onTapAgent = func;
    }

    destroy() {
        this.element.removeEventListener('touchstart', this.onTouchStart);
        this.element.removeEventListener('touchend', this.onTouchEnd);
        this.element.removeEventListener('pointerstart', this.onTouchStart);
        this.element.removeEventListener('pointermove', this.onTouchMove);
        this.element.removeEventListener('touchover', this.onTouchEnd);
    }

	handleGesture() {
        /**
         * swiped left
         */
        if (this.touchEndX + this.sensitive < this.touchStartX) {
            this.onSwipeLeftAgent &&
                this.onSwipeLeftAgent();
            return 'swiped left';
        }

        /**
         * swiped right
         */
        if (this.touchEndX - this.sensitive > this.touchStartX) {
            this.onSwipeRightAgent &&
                this.onSwipeRightAgent();
            return 'swiped right';
        }

        /**
         * swiped up
         */
        if (this.touchEndY + this.sensitive < this.touchStartY) {
            this.onSwipeUpAgent &&
                this.onSwipeUpAgent();
            return 'swiped up';
        }

        /**
         * swiped down
         */
        if (this.touchEndY - this.sensitive > this.touchStartY) {
            this.onSwipeDownAgent &&
                this.onSwipeDownAgent();
            return 'swiped down';
        }

        /**
         * tap
         */
        // if (this.touchEndY === this.touchStartY) {
        //     this.onTapAgent &&
        //         this.onTapAgent();
        //     return 'tap';
        // }
    }
}